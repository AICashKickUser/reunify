import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      )
    }

    const caseData = await db.case.findUnique({
      where: { id: caseId },
      include: {
        requirements: { orderBy: { sortOrder: 'asc' } },
        counselingSessions: { orderBy: { date: 'desc' } },
        drugTests: { orderBy: { date: 'desc' } },
        naSteps: { orderBy: { stepNumber: 'asc' } },
        naMeetings: { orderBy: { date: 'desc' } },
        supervisedVisits: { orderBy: { date: 'desc' } },
        courtDates: { orderBy: { date: 'desc' } },
        parentingClasses: { orderBy: { date: 'desc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        dailyCheckIns: { orderBy: { date: 'desc' } },
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Generate a formatted report
    const report = {
      exportDate: new Date().toISOString(),
      exportType: 'Reunify Case Data Export',
      case: {
        caseNumber: caseData.caseNumber,
        court: caseData.courtName,
        caseworker: caseData.caseworkerName,
        caseworkerPhone: caseData.caseworkerPhone,
        judge: caseData.judgeName,
        attorney: caseData.attorneyName,
        attorneyPhone: caseData.attorneyPhone,
        removalDate: caseData.removalDate,
        targetReunificationDate: caseData.targetReunificationDate,
        status: caseData.caseStatus,
        notes: caseData.notes,
      },
      requirements: caseData.requirements.map((r) => ({
        category: r.category,
        title: r.title,
        description: r.description,
        frequency: r.frequency,
        isCompleted: r.isCompleted,
        completedAt: r.completedAt,
        dueDate: r.dueDate,
        notes: r.notes,
      })),
      counselingSessions: caseData.counselingSessions.map((s) => ({
        date: s.date,
        counselor: s.counselorName,
        type: s.sessionType,
        duration: s.duration ? `${s.duration} minutes` : null,
        completed: s.isCompleted,
        notes: s.notes,
      })),
      drugTests: caseData.drugTests.map((t) => ({
        date: t.date,
        type: t.testType,
        random: t.isRandom,
        result: t.result,
        facility: t.testingFacility,
        notes: t.notes,
      })),
      naSteps: caseData.naSteps.map((s) => ({
        step: s.stepNumber,
        title: s.title,
        completed: s.isCompleted,
        completedAt: s.completedAt,
        sponsorVerified: s.sponsorVerified,
        sponsorName: s.sponsorName,
        notes: s.notes,
      })),
      naMeetings: caseData.naMeetings.map((m) => ({
        date: m.date,
        name: m.meetingName,
        location: m.location,
        speaker: m.speaker,
        topic: m.topic,
        verified: m.isVerified,
        notes: m.notes,
      })),
      supervisedVisits: caseData.supervisedVisits.map((v) => ({
        date: v.date,
        type: v.visitType,
        location: v.location,
        supervisor: v.supervisorName,
        duration: v.duration ? `${v.duration} minutes` : null,
        childBehavior: v.childBehavior,
        parentBehavior: v.parentBehavior,
        completed: v.isCompleted,
        notes: v.notes,
      })),
      courtDates: caseData.courtDates.map((c) => ({
        date: c.date,
        type: c.hearingType,
        outcome: c.outcome,
        judgeNotes: c.judgeNotes,
        nextSteps: c.nextSteps,
        completed: c.isCompleted,
      })),
      parentingClasses: caseData.parentingClasses.map((p) => ({
        date: p.date,
        name: p.className,
        provider: p.provider,
        topic: p.topic,
        completed: p.isCompleted,
        hasCertificate: p.hasCertificate,
        notes: p.notes,
      })),
      milestones: caseData.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        category: m.category,
        targetDate: m.targetDate,
        completedAt: m.completedAt,
        completed: m.isCompleted,
        notes: m.notes,
      })),
      dailyCheckIns: caseData.dailyCheckIns.map((d) => ({
        date: d.date,
        mood: d.mood,
        drugTestRequired: d.drugTestRequired,
        drugTestCompleted: d.drugTestCompleted,
        meetingsAttended: d.meetingsAttended,
        notes: d.notes,
      })),
      // Summary statistics
      summary: {
        totalRequirements: caseData.requirements.length,
        completedRequirements: caseData.requirements.filter(
          (r) => r.isCompleted
        ).length,
        totalDrugTests: caseData.drugTests.filter((t) => t.result).length,
        negativeDrugTests: caseData.drugTests.filter(
          (t) => t.result === 'negative'
        ).length,
        completedNASteps: caseData.naSteps.filter((s) => s.isCompleted).length,
        totalCounselingSessions: caseData.counselingSessions.filter(
          (s) => s.isCompleted
        ).length,
        completedVisits: caseData.supervisedVisits.filter(
          (v) => v.isCompleted
        ).length,
        completedMilestones: caseData.milestones.filter(
          (m) => m.isCompleted
        ).length,
      },
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error exporting case data:', error)
    return NextResponse.json(
      { error: 'Failed to export case data' },
      { status: 500 }
    )
  }
}
