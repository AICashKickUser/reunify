import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const sessions = await db.counselingSession.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching counseling sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch counseling sessions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const session = await db.counselingSession.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date),
        counselorName: body.counselorName,
        sessionType: body.sessionType,
        duration: body.duration,
        notes: body.notes,
        isCompleted: body.isCompleted ?? false,
      },
    })
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating counseling session:', error)
    return NextResponse.json({ error: 'Failed to create counseling session' }, { status: 500 })
  }
}
