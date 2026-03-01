import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const ENGINE_MATRIX = {
  skeletonType: ['Origin Story', 'Price Action', 'Institutional Trend', 'Developer Update', 'Community Milestone'],
  primaryFunction: ['Education', 'Hype', 'Utility', 'Value Proposition', 'Risk Assessment'],
  secondaryFunction: ['FOMO', 'Credibility', 'Scarcity', 'Adoption', 'Security'],
  investorTension: ['Bullish', 'Bearish', 'Neutral', 'Uncertain', 'Opportunistic'],
  cashtagRelationship: ['Comparison', 'Hierarchy', 'Synergy', 'Contrast', 'Partnership'],
  openingMechanic: ['Question', 'Statement', 'Data', 'Story', 'Paradox'],
  proofCluster: ['On-chain', 'Community', 'Developer', 'Market', 'Adoption'],
  blueprintMode: ['Technical', 'Narrative', 'Psychological', 'Social', 'Economic'],
  toneDial: ['Casual', 'Professional', 'Optimistic', 'Critical', 'Neutral'],
  closingPosition: ['Call to Action', 'Reflection', 'Prediction', 'Affirmation', 'Question'],
}

function getRandomFromArray(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateRandomPreset(): Record<string, string> {
  return {
    skeletonType: getRandomFromArray(ENGINE_MATRIX.skeletonType),
    primaryFunction: getRandomFromArray(ENGINE_MATRIX.primaryFunction),
    secondaryFunction: getRandomFromArray(ENGINE_MATRIX.secondaryFunction),
    investorTension: getRandomFromArray(ENGINE_MATRIX.investorTension),
    cashtagRelationship: getRandomFromArray(ENGINE_MATRIX.cashtagRelationship),
    openingMechanic: getRandomFromArray(ENGINE_MATRIX.openingMechanic),
    proofCluster: getRandomFromArray(ENGINE_MATRIX.proofCluster),
    blueprintMode: getRandomFromArray(ENGINE_MATRIX.blueprintMode),
    toneDial: getRandomFromArray(ENGINE_MATRIX.toneDial),
    closingPosition: getRandomFromArray(ENGINE_MATRIX.closingPosition),
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const presets = await prisma.enginePreset.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(presets)
  } catch (error) {
    console.error('Error fetching presets:', error)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'generate') {
      // Generate 10-20 random presets
      const count = Math.floor(Math.random() * 11) + 10 // 10-20
      const presets = []

      for (let i = 0; i < count; i++) {
        const preset = generateRandomPreset()
        const savedPreset = await prisma.enginePreset.create({
          data: {
            projectId: params.id,
            name: `${preset.skeletonType} - ${preset.primaryFunction} (${i + 1})`,
            ...preset,
          } as any,
        })
        presets.push(savedPreset)
      }

      return NextResponse.json(presets)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating presets:', error)
    return NextResponse.json({ error: 'Failed to create presets' }, { status: 500 })
  }
}
