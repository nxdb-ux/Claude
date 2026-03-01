import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { factIds } = await request.json() as { factIds: string[] }

    await prisma.fact.updateMany({
      where: {
        id: { in: factIds },
        projectId: params.id,
      },
      data: { approved: true },
    })

    const updatedFacts = await prisma.fact.findMany({
      where: {
        id: { in: factIds },
      },
    })

    return NextResponse.json(updatedFacts)
  } catch (error) {
    console.error('Error bulk approving facts:', error)
    return NextResponse.json({ error: 'Failed to bulk approve facts' }, { status: 500 })
  }
}
