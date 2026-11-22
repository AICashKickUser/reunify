import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const log = await db.communicationLog.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date.slice(0, 10) + 'T12:00:00.000Z') : undefined,
        contactType: body.contactType,
        direction: body.direction,
        contactName: body.contactName,
        contactRole: body.contactRole,
        subject: body.subject,
        notes: body.notes,
        actionItems: body.actionItems,
        followUpDate: body.followUpDate
          ? new Date(body.followUpDate.slice(0, 10) + 'T12:00:00.000Z')
          : body.followUpDate === null
            ? null
            : undefined,
        isFollowUpCompleted: body.isFollowUpCompleted,
      },
    })
    return NextResponse.json(log)
  } catch (error) {
    console.error('Error updating communication log:', error)
    return NextResponse.json({ error: 'Failed to update communication log' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.communicationLog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting communication log:', error)
    return NextResponse.json({ error: 'Failed to delete communication log' }, { status: 500 })
  }
}
