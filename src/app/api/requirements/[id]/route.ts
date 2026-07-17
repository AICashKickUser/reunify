import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const requirement = await db.caseRequirement.update({
      where: { id },
      data: {
        category: body.category,
        title: body.title,
        description: body.description,
        frequency: body.frequency,
        isCompleted: body.isCompleted,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes,
        sortOrder: body.sortOrder,
      },
    })
    return NextResponse.json(requirement)
  } catch (error) {
    console.error('Error updating requirement:', error)
    return NextResponse.json({ error: 'Failed to update requirement' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.caseRequirement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting requirement:', error)
    return NextResponse.json({ error: 'Failed to delete requirement' }, { status: 500 })
  }
}
