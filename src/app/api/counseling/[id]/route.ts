import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const session = await db.counselingSession.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        counselorName: body.counselorName,
        sessionType: body.sessionType,
        duration: body.duration,
        notes: body.notes,
        isCompleted: body.isCompleted,
      },
    })
    return NextResponse.json(session)
  } catch (error) {
    console.error('Error updating counseling session:', error)
    return NextResponse.json({ error: 'Failed to update counseling session' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.counselingSession.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting counseling session:', error)
    return NextResponse.json({ error: 'Failed to delete counseling session' }, { status: 500 })
  }
}
