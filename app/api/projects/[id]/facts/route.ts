import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')

    const where: any = { projectId: params.id }
    if (approved === 'true') {
      where.approved = true
    } else if (approved === 'false') {
      where.approved = false
    }

    const facts = await prisma.fact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(facts)
  } catch (error) {
    console.error('Error fetching facts:', error)
    return NextResponse.json({ error: 'Failed to fetch facts' }, { status: 500 })
  }
}
