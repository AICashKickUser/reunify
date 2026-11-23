import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const doc = await db.caseDocument.update({
      where: { id },
      data: {
        title: body.title,
        documentType: body.documentType,
        date: body.date ? new Date(body.date.slice(0, 10) + 'T12:00:00.000Z') : undefined,
        issuer: body.issuer,
        notes: body.notes,
      },
    })
    return NextResponse.json(doc)
  } catch (error) {
    console.error('Error updating case document:', error)
    return NextResponse.json({ error: 'Failed to update case document' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.caseDocument.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting case document:', error)
    return NextResponse.json({ error: 'Failed to delete case document' }, { status: 500 })
  }
}
