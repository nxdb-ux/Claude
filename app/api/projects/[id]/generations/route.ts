import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { generatePost, getOpenAIClient } from '@/lib/openai'
import { qaChecker } from '@/lib/qa-checker'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const generations = await prisma.generation.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(generations)
  } catch (error) {
    console.error('Error fetching generations:', error)
    return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const openai = getOpenAIClient()
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { mode, cashtagA, cashtagB, enginePresetId, factIds } = body

    // Get preset
    let preset = null
    if (enginePresetId) {
      preset = await prisma.enginePreset.findUnique({
        where: { id: enginePresetId },
      })
    } else {
      // Random preset
      const presets = await prisma.enginePreset.findMany({
        where: { projectId: id },
      })
      if (presets.length > 0) {
        preset = presets[Math.floor(Math.random() * presets.length)]
      }
    }

    if (!preset) {
      return NextResponse.json({ error: 'No preset found' }, { status: 400 })
    }

    // Get facts
    const facts = await prisma.fact.findMany({
      where: {
        id: { in: factIds },
        projectId: id,
        approved: true,
      },
    })

    if (facts.length === 0) {
      return NextResponse.json({ error: 'No approved facts selected' }, { status: 400 })
    }

    // Get project for tone profile
    const project = await prisma.project.findUnique({
      where: { id },
    })

    // Generate post
    let generation: any = {
      copyHook: '',
      thumbnailHook: '',
      bodyText: '',
    }

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      const result = await generatePost(preset, facts, mode, cashtagA, cashtagB, project?.toneProfile || undefined)

      if (!result) {
        return NextResponse.json(
          { error: 'Failed to generate post' },
          { status: 500 }
        )
      }

      generation = result

      // Run QA check
      const qaResult = qaChecker(
        generation.copyHook,
        generation.thumbnailHook,
        generation.bodyText,
        cashtagA,
        cashtagB
      )

      if (qaResult.passed) {
        break
      }

      // Try to auto-fix
      if (attempts < maxAttempts - 1) {
        const violationsText = qaResult.violations.join('\n')
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
              {
                role: 'system',
                content: `You are fixing a CoinMarketCap Community post that failed QA checks.
                Fix only the violations listed, without changing the core message or adding new facts.
                Output format:
                Line 1: Copy hook
                Line 2: Thumbnail hook
                [blank line]
                [fixed post body]`,
              },
              {
                role: 'user',
                content: `Fix these violations in the post:
${violationsText}

Current post:
Copy hook: ${generation.copyHook}
Thumbnail hook: ${generation.thumbnailHook}
Body: ${generation.bodyText}

Fix and output the corrected post.`,
              },
            ],
            temperature: 0.5,
            max_tokens: 1500,
          })

          const fixedContent = response.choices[0]?.message?.content || ''
          const fixedLines = fixedContent.split('\n')

          if (fixedLines.length >= 2) {
            generation.copyHook = fixedLines[0].trim()
            generation.thumbnailHook = fixedLines[1].trim()

            let bodyStart = 0
            for (let i = 2; i < fixedLines.length; i++) {
              if (fixedLines[i].trim() === '') {
                bodyStart = i + 1
                break
              }
            }
            generation.bodyText = fixedLines.slice(bodyStart).join('\n').trim()
          }
        } catch (e) {
          console.error('Error during auto-fix:', e)
          // Continue with original generation
        }
      }

      attempts++
    }

    // Final QA check
    const finalQa = qaChecker(
      generation.copyHook,
      generation.thumbnailHook,
      generation.bodyText,
      cashtagA,
      cashtagB
    )

    // Save generation
    const savedGeneration = await prisma.generation.create({
      data: {
        projectId: id,
        enginePresetId: preset.id,
        mode,
        cashtagA,
        cashtagB,
        copyHook: generation.copyHook,
        thumbnailHook: generation.thumbnailHook,
        bodyText: generation.bodyText,
        qaPassed: finalQa.passed,
        qaReport: JSON.stringify(finalQa),
        usedFactIds: JSON.stringify(facts.map((f) => f.id)),
      },
    })

    return NextResponse.json(savedGeneration)
  } catch (error) {
    console.error('Error generating post:', error)
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    )
  }
}
