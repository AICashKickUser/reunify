import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify case exists
    const caseExists = await db.case.findUnique({ where: { id } })
    if (!caseExists) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Delete all related data but keep the case
    await db.dailyCheckIn.deleteMany({ where: { caseId: id } })
    await db.milestone.deleteMany({ where: { caseId: id } })
    await db.parentingClass.deleteMany({ where: { caseId: id } })
    await db.courtDate.deleteMany({ where: { caseId: id } })
    await db.supervisedVisit.deleteMany({ where: { caseId: id } })
    await db.nAMeeting.deleteMany({ where: { caseId: id } })
    await db.nAStep.deleteMany({ where: { caseId: id } })
    await db.drugTest.deleteMany({ where: { caseId: id } })
    await db.counselingSession.deleteMany({ where: { caseId: id } })
    await db.caseRequirement.deleteMany({ where: { caseId: id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json({ error: 'Failed to reset case data' }, { status: 500 })
  }
}
