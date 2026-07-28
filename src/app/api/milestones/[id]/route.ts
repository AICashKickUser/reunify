import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const milestone = await db.milestone.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        targetDate: body.targetDate ? new Date(body.targetDate.slice(0, 10) + 'T12:00:00.000Z') : null,
        completedAt: body.completedAt ? new Date(body.completedAt.slice(0, 10) + 'T12:00:00.000Z') : null,
        isCompleted: body.isCompleted,
        notes: body.notes,
      },
    })
    return NextResponse.json(milestone)
  } catch (error) {
    console.error('Error updating milestone:', error)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.milestone.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  }
}
