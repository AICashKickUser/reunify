import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const cases = await db.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            requirements: true,
            counselingSessions: true,
            drugTests: true,
            naSteps: true,
            naMeetings: true,
            supervisedVisits: true,
            courtDates: true,
            parentingClasses: true,
            milestones: true,
            dailyCheckIns: true,
          },
        },
      },
    })
    return NextResponse.json(cases)
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newCase = await db.case.create({
      data: {
        caseNumber: body.caseNumber,
        courtName: body.courtName,
        caseworkerName: body.caseworkerName,
        caseworkerPhone: body.caseworkerPhone,
        judgeName: body.judgeName,
        attorneyName: body.attorneyName,
        attorneyPhone: body.attorneyPhone,
        removalDate: body.removalDate ? new Date(body.removalDate) : null,
        targetReunificationDate: body.targetReunificationDate ? new Date(body.targetReunificationDate) : null,
        caseStatus: body.caseStatus || 'active',
        notes: body.notes,
      },
    })
    return NextResponse.json(newCase, { status: 201 })
  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}
