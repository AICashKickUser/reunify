import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const checkin = await db.dailyCheckIn.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        mood: body.mood,
        drugTestRequired: body.drugTestRequired,
        drugTestCompleted: body.drugTestCompleted,
        meetingsAttended: body.meetingsAttended,
        notes: body.notes,
      },
    })
    return NextResponse.json(checkin)
  } catch (error) {
    console.error('Error updating daily checkin:', error)
    return NextResponse.json({ error: 'Failed to update daily checkin' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.dailyCheckIn.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting daily checkin:', error)
    return NextResponse.json({ error: 'Failed to delete daily checkin' }, { status: 500 })
  }
}
