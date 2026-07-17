import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const caseData = await db.case.findUnique({
      where: { id },
      include: {
        requirements: { orderBy: { sortOrder: 'asc' } },
        counselingSessions: { orderBy: { date: 'desc' } },
        drugTests: { orderBy: { date: 'desc' } },
        naSteps: { orderBy: { stepNumber: 'asc' } },
        naMeetings: { orderBy: { date: 'desc' } },
        supervisedVisits: { orderBy: { date: 'desc' } },
        courtDates: { orderBy: { date: 'desc' } },
        parentingClasses: { orderBy: { date: 'desc' } },
        milestones: { orderBy: { createdAt: 'desc' } },
        dailyCheckIns: { orderBy: { date: 'desc' } },
      },
    })
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    return NextResponse.json(caseData)
  } catch (error) {
    console.error('Error fetching case:', error)
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const updatedCase = await db.case.update({
      where: { id },
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
        caseStatus: body.caseStatus,
        notes: body.notes,
      },
    })
    return NextResponse.json(updatedCase)
  } catch (error) {
    console.error('Error updating case:', error)
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.case.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting case:', error)
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}
