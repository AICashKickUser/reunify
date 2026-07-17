import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const checkins = await db.dailyCheckIn.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(checkins)
  } catch (error) {
    console.error('Error fetching daily checkins:', error)
    return NextResponse.json({ error: 'Failed to fetch daily checkins' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const checkin = await db.dailyCheckIn.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date),
        mood: body.mood,
        drugTestRequired: body.drugTestRequired ?? false,
        drugTestCompleted: body.drugTestCompleted ?? false,
        meetingsAttended: body.meetingsAttended ?? 0,
        notes: body.notes,
      },
    })
    return NextResponse.json(checkin, { status: 201 })
  } catch (error) {
    console.error('Error creating daily checkin:', error)
    return NextResponse.json({ error: 'Failed to create daily checkin' }, { status: 500 })
  }
}
