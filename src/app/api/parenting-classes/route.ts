import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const classes = await db.parentingClass.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(classes)
  } catch (error) {
    console.error('Error fetching parenting classes:', error)
    return NextResponse.json({ error: 'Failed to fetch parenting classes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parentingClass = await db.parentingClass.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date),
        className: body.className,
        provider: body.provider,
        topic: body.topic,
        isCompleted: body.isCompleted ?? false,
        hasCertificate: body.hasCertificate ?? false,
        notes: body.notes,
      },
    })
    return NextResponse.json(parentingClass, { status: 201 })
  } catch (error) {
    console.error('Error creating parenting class:', error)
    return NextResponse.json({ error: 'Failed to create parenting class' }, { status: 500 })
  }
}
