import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parentingClass = await db.parentingClass.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        className: body.className,
        provider: body.provider,
        topic: body.topic,
        isCompleted: body.isCompleted,
        hasCertificate: body.hasCertificate,
        notes: body.notes,
      },
    })
    return NextResponse.json(parentingClass)
  } catch (error) {
    console.error('Error updating parenting class:', error)
    return NextResponse.json({ error: 'Failed to update parenting class' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.parentingClass.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting parenting class:', error)
    return NextResponse.json({ error: 'Failed to delete parenting class' }, { status: 500 })
  }
}
