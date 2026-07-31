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
    // IMPORTANT: Field names must match the API POST endpoints so that
    // the backup restore can pass data directly to the API without mapping.
    const report = {
      exportDate: new Date().toISOString(),
      exportType: 'Reunify Case Data Export',
      case: {
        caseNumber: caseData.caseNumber,
        courtName: caseData.courtName,
        caseworkerName: caseData.caseworkerName,
        caseworkerPhone: caseData.caseworkerPhone,
        judgeName: caseData.judgeName,
        attorneyName: caseData.attorneyName,
        attorneyPhone: caseData.attorneyPhone,
        removalDate: caseData.removalDate,
        targetReunificationDate: caseData.targetReunificationDate,
        caseStatus: caseData.caseStatus,
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
        sortOrder: r.sortOrder,
      })),
      counselingSessions: caseData.counselingSessions.map((s) => ({
        date: s.date,
        counselorName: s.counselorName,
        sessionType: s.sessionType,
        duration: s.duration,
        isCompleted: s.isCompleted,
        notes: s.notes,
      })),
      drugTests: caseData.drugTests.map((t) => ({
        date: t.date,
        testType: t.testType,
        isRandom: t.isRandom,
        result: t.result,
        testingFacility: t.testingFacility,
        notes: t.notes,
        callMade: t.callMade,
        callResult: t.callResult,
        tested: t.tested,
      })),
      naSteps: caseData.naSteps.map((s) => ({
        stepNumber: s.stepNumber,
        title: s.title,
        description: s.description,
        isCompleted: s.isCompleted,
        completedAt: s.completedAt,
        sponsorVerified: s.sponsorVerified,
        sponsorName: s.sponsorName,
        notes: s.notes,
      })),
      naMeetings: caseData.naMeetings.map((m) => ({
        date: m.date,
        meetingName: m.meetingName,
        location: m.location,
        speaker: m.speaker,
        topic: m.topic,
        isVerified: m.isVerified,
        notes: m.notes,
      })),
      supervisedVisits: caseData.supervisedVisits.map((v) => ({
        date: v.date,
        visitType: v.visitType,
        location: v.location,
        supervisorName: v.supervisorName,
        duration: v.duration,
        childBehavior: v.childBehavior,
        parentBehavior: v.parentBehavior,
        isCompleted: v.isCompleted,
        notes: v.notes,
      })),
      courtDates: caseData.courtDates.map((c) => ({
        date: c.date,
        hearingType: c.hearingType,
        outcome: c.outcome,
        judgeNotes: c.judgeNotes,
        nextSteps: c.nextSteps,
        isCompleted: c.isCompleted,
        notes: c.notes,
      })),
      parentingClasses: caseData.parentingClasses.map((p) => ({
        date: p.date,
        className: p.className,
        provider: p.provider,
        topic: p.topic,
        isCompleted: p.isCompleted,
        hasCertificate: p.hasCertificate,
        notes: p.notes,
      })),
      milestones: caseData.milestones.map((m) => ({
        title: m.title,
        description: m.description,
        category: m.category,
        targetDate: m.targetDate,
        completedAt: m.completedAt,
        isCompleted: m.isCompleted,
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
