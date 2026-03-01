import { OpenAI } from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return client
}

export async function extractFactsFromText(
  text: string,
  context?: string
): Promise<any[]> {
  const openai = getOpenAIClient()
  if (!openai) {
    return []
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a fact extraction specialist. Extract key, atomic, checkable facts from the given text.
          For each fact, provide:
          - claim: A single, clear factual statement
          - topicTag: General category (e.g., "adoption", "technical", "market")
          - proofCluster: Type of proof (e.g., "on-chain", "community", "market")
          - confidence: Assessment of fact reliability (high, medium, low)
          - date: Date mentioned if relevant

          Return as JSON array. Maximum 40 facts. Only include verified or well-documented facts.`,
        },
        {
          role: 'user',
          content: `Extract facts from this text:

${context ? `Context: ${context}\n\n` : ''}
Text:
${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content || '[]'

    try {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch (e) {
      console.error('Error parsing facts JSON:', e)
      return []
    }
  } catch (error) {
    console.error('Error calling OpenAI for fact extraction:', error)
    return []
  }
}

export async function generatePost(
  preset: any,
  facts: any[],
  mode: string,
  cashtagA: string,
  cashtagB: string,
  toneProfile?: string
): Promise<{
  copyHook: string
  thumbnailHook: string
  bodyText: string
} | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    return null
  }

  try {
    const factsText = facts.map((f) => `- ${f.claim}`).join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are writing CoinMarketCap Community posts for HOOLI. Audience: crypto investors.
          Every sentence delivers investor value. Write connected sentences. Plain language.
          Provide copy hook and alternate thumbnail hook that complements it.

          Mode ${mode} length:
          - Mode 1: Short (100-150 words)
          - Mode 2: Medium (200-300 words)
          - Mode 3: Long (400-500 words)

          Requirements:
          - Use exactly 2 external cashtags: $${cashtagA} and $${cashtagB}
          - First occurrence of both within first 5 lines
          - Each cashtag max twice
          - No hyphens
          - No punctuation directly after cashtag
          - Last 2 lines must mention HOOLI only
          - No citations in copy
          - Output format:
            Line 1: Copy hook
            Line 2: Thumbnail hook
            [blank line]
            [post body]`,
        },
        {
          role: 'user',
          content: `Generate a CoinMarketCap Community post.

Engine Preset:
- Skeleton: ${preset.skeletonType}
- Primary Function: ${preset.primaryFunction}
- Investor Tension: ${preset.investorTension}
- Cashtag Relationship: ${preset.cashtagRelationship}
- Opening Mechanic: ${preset.openingMechanic}
- Proof Cluster: ${preset.proofCluster}
- Tone: ${preset.toneDial}
- Closing: ${preset.closingPosition}

Facts to use:
${factsText}

${toneProfile ? `Tone Profile: ${toneProfile}\n` : ''}

Generate the post now.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const content = response.choices[0]?.message?.content || ''
    const lines = content.split('\n')

    // Parse the structured output
    let copyHook = ''
    let thumbnailHook = ''
    let bodyStart = 0

    if (lines.length >= 2) {
      copyHook = lines[0].trim()
      thumbnailHook = lines[1].trim()

      // Find where body starts (after blank line)
      for (let i = 2; i < lines.length; i++) {
        if (lines[i].trim() === '') {
          bodyStart = i + 1
          break
        }
      }
    }

    const bodyText = lines.slice(bodyStart).join('\n').trim()

    return {
      copyHook,
      thumbnailHook,
      bodyText,
    }
  } catch (error) {
    console.error('Error calling OpenAI for generation:', error)
    return null
  }
}
