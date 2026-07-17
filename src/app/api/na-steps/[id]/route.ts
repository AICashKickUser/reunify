import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const step = await db.nAStep.update({
      where: { id },
      data: {
        stepNumber: body.stepNumber,
        title: body.title,
        description: body.description,
        isCompleted: body.isCompleted,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        sponsorVerified: body.sponsorVerified,
        sponsorName: body.sponsorName,
        notes: body.notes,
      },
    })
    return NextResponse.json(step)
  } catch (error) {
    console.error('Error updating NA step:', error)
    return NextResponse.json({ error: 'Failed to update NA step' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.nAStep.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NA step:', error)
    return NextResponse.json({ error: 'Failed to delete NA step' }, { status: 500 })
  }
}
