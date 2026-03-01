import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; presetId: string } }
) {
  try {
    const body = await request.json()

    const updatedPreset = await prisma.enginePreset.update({
      where: { id: params.presetId },
      data: body,
    })

    return NextResponse.json(updatedPreset)
  } catch (error) {
    console.error('Error updating preset:', error)
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 })
  }
}
