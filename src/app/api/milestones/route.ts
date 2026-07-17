import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const milestones = await db.milestone.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(milestones)
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const milestone = await db.milestone.create({
      data: {
        caseId: body.caseId,
        title: body.title,
        description: body.description,
        category: body.category,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        isCompleted: body.isCompleted ?? false,
        notes: body.notes,
      },
    })
    return NextResponse.json(milestone, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  }
}
