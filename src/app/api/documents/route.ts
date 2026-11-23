import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const docs = await db.caseDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(docs)
  } catch (error) {
    console.error('Error fetching case documents:', error)
    return NextResponse.json({ error: 'Failed to fetch case documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const doc = await db.caseDocument.create({
      data: {
        caseId: body.caseId,
        title: body.title || 'Untitled Document',
        documentType: body.documentType,
        date: body.date ? new Date(body.date.slice(0, 10) + 'T12:00:00.000Z') : null,
        issuer: body.issuer,
        notes: body.notes,
        fileData: body.fileData,
        fileName: body.fileName,
        fileType: body.fileType,
        fileSize: body.fileSize,
      },
    })
    return NextResponse.json(doc, { status: 201 })
  } catch (error) {
    console.error('Error creating case document:', error)
    return NextResponse.json({ error: 'Failed to create case document' }, { status: 500 })
  }
}
