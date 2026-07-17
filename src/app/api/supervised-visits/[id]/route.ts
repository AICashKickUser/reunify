import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const visit = await db.supervisedVisit.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        location: body.location,
        supervisorName: body.supervisorName,
        duration: body.duration,
        childBehavior: body.childBehavior,
        parentBehavior: body.parentBehavior,
        notes: body.notes,
        isCompleted: body.isCompleted,
        visitType: body.visitType,
      },
    })
    return NextResponse.json(visit)
  } catch (error) {
    console.error('Error updating supervised visit:', error)
    return NextResponse.json({ error: 'Failed to update supervised visit' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.supervisedVisit.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supervised visit:', error)
    return NextResponse.json({ error: 'Failed to delete supervised visit' }, { status: 500 })
  }
}
