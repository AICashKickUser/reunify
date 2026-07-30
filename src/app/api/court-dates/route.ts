import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const courtDates = await db.courtDate.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(courtDates)
  } catch (error) {
    console.error('Error fetching court dates:', error)
    return NextResponse.json({ error: 'Failed to fetch court dates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const courtDate = await db.courtDate.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date.slice(0, 10) + 'T12:00:00.000Z'),
        hearingType: body.hearingType,
        outcome: body.outcome,
        judgeNotes: body.judgeNotes,
        nextSteps: body.nextSteps,
        notes: body.notes,
        isCompleted: body.isCompleted ?? false,
      },
    })
    return NextResponse.json(courtDate, { status: 201 })
  } catch (error) {
    console.error('Error creating court date:', error)
    return NextResponse.json({ error: 'Failed to create court date' }, { status: 500 })
  }
}
