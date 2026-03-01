import { prisma } from '@/lib/db'
import { extractFactsFromText } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Get all sources for this project
    const sources = await prisma.source.findMany({
      where: { projectId: id, status: 'fetched' },
    })

    const allFacts = []

    for (const source of sources) {
      if (!source.rawText) continue

      // Extract facts from source
      const facts = await extractFactsFromText(
        source.rawText,
        `From source: ${source.title || source.url}`
      )

      // Save extracted facts
      for (const fact of facts) {
        const savedFact = await prisma.fact.create({
          data: {
            projectId: id,
            claim: fact.claim || '',
            topicTag: fact.topicTag || null,
            proofCluster: fact.proofCluster || null,
            confidence: fact.confidence || 'medium',
            date: fact.date ? new Date(fact.date) : null,
            sourceId: source.id,
            sourceUrl: source.url,
            approved: false,
          },
        })
        allFacts.push(savedFact)
      }
    }

    return NextResponse.json({
      success: true,
      factsExtracted: allFacts.length,
      facts: allFacts,
    })
  } catch (error) {
    console.error('Error extracting facts from sources:', error)
    return NextResponse.json(
      { error: 'Failed to extract facts from sources' },
      { status: 500 }
    )
  }
}
