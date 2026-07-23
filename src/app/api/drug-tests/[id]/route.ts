import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const drugTest = await db.drugTest.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        testType: body.testType,
        isRandom: body.isRandom,
        result: body.result,
        testingFacility: body.testingFacility,
        notes: body.notes,
        callMade: body.callMade,
        callResult: body.callResult,
        tested: body.tested,
      },
    })
    return NextResponse.json(drugTest)
  } catch (error) {
    console.error('Error updating drug test:', error)
    return NextResponse.json({ error: 'Failed to update drug test' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.drugTest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting drug test:', error)
    return NextResponse.json({ error: 'Failed to delete drug test' }, { status: 500 })
  }
}
