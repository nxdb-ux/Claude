import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; factId: string }> }
) {
  try {
    const { id, factId } = await params
    const body = await request.json()
    const { approved } = body as { approved: boolean }

    const fact = await prisma.fact.update({
      where: { id: factId },
      data: { approved },
    })

    return NextResponse.json(fact)
  } catch (error) {
    console.error('Error updating fact:', error)
    return NextResponse.json({ error: 'Failed to update fact' }, { status: 500 })
  }
}
