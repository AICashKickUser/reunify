import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { caseId, data, version } = body

    if (!caseId || !data) {
      return NextResponse.json(
        { error: 'caseId and data are required' },
        { status: 400 }
      )
    }

    // Verify the case exists
    const caseExists = await db.case.findUnique({ where: { id: caseId } })
    if (!caseExists) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      )
    }

    // Check if there's an existing backup for this case
    const existingBackup = await db.cloudBackup.findFirst({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    })

    let backup
    if (existingBackup) {
      // Update the existing backup
      backup = await db.cloudBackup.update({
        where: { id: existingBackup.id },
        data: {
          data,
          version: version || '1.0.0',
        },
      })
    } else {
      // Create a new backup
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
      updatedAt: backup.updatedAt,
      dataSize: data.length,
    })
  } catch (error) {
    console.error('Error uploading backup:', error)
    return NextResponse.json(
      { error: 'Failed to upload backup' },
      { status: 500 }
    )
  }
}
