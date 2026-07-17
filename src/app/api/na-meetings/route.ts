import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const meetings = await db.nAMeeting.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(meetings)
  } catch (error) {
    console.error('Error fetching NA meetings:', error)
    return NextResponse.json({ error: 'Failed to fetch NA meetings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const meeting = await db.nAMeeting.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date),
        meetingName: body.meetingName,
        location: body.location,
        speaker: body.speaker,
        topic: body.topic,
        isVerified: body.isVerified ?? false,
        notes: body.notes,
      },
    })
    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    console.error('Error creating NA meeting:', error)
    return NextResponse.json({ error: 'Failed to create NA meeting' }, { status: 500 })
  }
}
