import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const logs = await db.communicationLog.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching communication logs:', error)
    return NextResponse.json({ error: 'Failed to fetch communication logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const log = await db.communicationLog.create({
      data: {
        caseId: body.caseId,
        date: body.date ? new Date(body.date.slice(0, 10) + 'T12:00:00.000Z') : new Date(),
        contactType: body.contactType,
        direction: body.direction,
        contactName: body.contactName,
        contactRole: body.contactRole,
        subject: body.subject,
        notes: body.notes,
        actionItems: body.actionItems,
        followUpDate: body.followUpDate ? new Date(body.followUpDate.slice(0, 10) + 'T12:00:00.000Z') : null,
        isFollowUpCompleted: body.isFollowUpCompleted ?? false,
      },
    })
    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('Error creating communication log:', error)
    return NextResponse.json({ error: 'Failed to create communication log' }, { status: 500 })
  }
}
