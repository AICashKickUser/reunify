import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const meeting = await db.nAMeeting.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        meetingName: body.meetingName,
        location: body.location,
        speaker: body.speaker,
        topic: body.topic,
        isVerified: body.isVerified,
        notes: body.notes,
      },
    })
    return NextResponse.json(meeting)
  } catch (error) {
    console.error('Error updating NA meeting:', error)
    return NextResponse.json({ error: 'Failed to update NA meeting' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.nAMeeting.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting NA meeting:', error)
    return NextResponse.json({ error: 'Failed to delete NA meeting' }, { status: 500 })
  }
}
