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

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const preset = await prisma.enginePreset.create({
      data: {
        projectId: id,
        name: `Random Preset ${Date.now()}`,
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
      },
    })

    return NextResponse.json(preset)
  } catch (error) {
    console.error('Error creating random preset:', error)
    return NextResponse.json({ error: 'Failed to create random preset' }, { status: 500 })
  }
}
