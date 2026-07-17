import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const caseId = request.nextUrl.searchParams.get('caseId')
    const where = caseId ? { caseId } : {}
    const drugTests = await db.drugTest.findMany({
      where,
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(drugTests)
  } catch (error) {
    console.error('Error fetching drug tests:', error)
    return NextResponse.json({ error: 'Failed to fetch drug tests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const drugTest = await db.drugTest.create({
      data: {
        caseId: body.caseId,
        date: new Date(body.date),
        testType: body.testType,
        isRandom: body.isRandom ?? false,
        result: body.result,
        testingFacility: body.testingFacility,
        notes: body.notes,
      },
    })
    return NextResponse.json(drugTest, { status: 201 })
  } catch (error) {
    console.error('Error creating drug test:', error)
    return NextResponse.json({ error: 'Failed to create drug test' }, { status: 500 })
  }
}
