import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const courtDate = await db.courtDate.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        hearingType: body.hearingType,
        outcome: body.outcome,
        judgeNotes: body.judgeNotes,
        nextSteps: body.nextSteps,
        isCompleted: body.isCompleted,
      },
    })
    return NextResponse.json(courtDate)
  } catch (error) {
    console.error('Error updating court date:', error)
    return NextResponse.json({ error: 'Failed to update court date' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.courtDate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting court date:', error)
    return NextResponse.json({ error: 'Failed to delete court date' }, { status: 500 })
  }
}
