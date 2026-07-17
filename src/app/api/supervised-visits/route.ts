import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const visits = await db.supervisedVisit.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(visits)
  } catch (error) {
    console.error('Error fetching supervised visits:', error)
    return NextResponse.json({ error: 'Failed to fetch supervised visits' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const visit = await db.supervisedVisit.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date),
        location: body.location,
        supervisorName: body.supervisorName,
        duration: body.duration,
        childBehavior: body.childBehavior,
        parentBehavior: body.parentBehavior,
        notes: body.notes,
        isCompleted: body.isCompleted ?? false,
        visitType: body.visitType,
      },
    })
    return NextResponse.json(visit, { status: 201 })
  } catch (error) {
    console.error('Error creating supervised visit:', error)
    return NextResponse.json({ error: 'Failed to create supervised visit' }, { status: 500 })
  }
}
