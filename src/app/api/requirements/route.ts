import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const requirements = await db.caseRequirement.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json(requirements)
  } catch (error) {
    console.error('Error fetching requirements:', error)
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const requirement = await db.caseRequirement.create({
      data: {
        caseId: body.caseId,
        category: body.category,
        title: body.title,
        description: body.description,
        frequency: body.frequency,
        isCompleted: body.isCompleted ?? false,
        completedAt: body.completedAt ? new Date(body.completedAt) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes,
        sortOrder: body.sortOrder ?? 0,
      },
    })
    return NextResponse.json(requirement, { status: 201 })
  } catch (error) {
    console.error('Error creating requirement:', error)
    return NextResponse.json({ error: 'Failed to create requirement' }, { status: 500 })
  }
}
