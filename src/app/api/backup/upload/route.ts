import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId, data, version } = body

    // Validate required fields
    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      )
    }

    // Verify the case exists
    const existingCase = await db.case.findUnique({
      where: { id: caseId },
    })

    if (!existingCase) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Upsert: find existing backup for this case, update or create
    const existingBackup = await db.cloudBackup.findFirst({
      where: { caseId },
    })

    let backup
    if (existingBackup) {
      backup = await db.cloudBackup.update({
        where: { id: existingBackup.id },
        data: {
          data,
          version: version || '1.0.0',
        },
      })
    } else {
      backup = await db.cloudBackup.create({
        data: {
          caseId,
          data,
          version: version || '1.0.0',
        },
      })
    }

    return NextResponse.json({
      success: true,
      backupId: backup.id,
    })
  } catch (error) {
    console.error('Error uploading backup:', error)
    return NextResponse.json(
      { error: 'Failed to upload backup' },
      { status: 500 }
    )
  }
}
