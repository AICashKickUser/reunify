import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const steps = await db.nAStep.findMany({
      where,
      orderBy: { stepNumber: 'asc' },
    })
    return NextResponse.json(steps)
  } catch (error) {
    console.error('Error fetching NA steps:', error)
    return NextResponse.json({ error: 'Failed to fetch NA steps' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const step = await db.nAStep.create({
      data: {
        caseId: body.caseId,
        stepNumber: body.stepNumber,
        title: body.title,
        description: body.description,
        isCompleted: body.isCompleted ?? false,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        sponsorVerified: body.sponsorVerified ?? false,
        sponsorName: body.sponsorName,
        notes: body.notes,
      },
    })
    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error('Error creating NA step:', error)
    return NextResponse.json({ error: 'Failed to create NA step' }, { status: 500 })
  }
}
