import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      )
    }

    // Find the latest backup for this case
    const backup = await db.cloudBackup.findFirst({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    })

    // Count total backups
    const backupCount = await db.cloudBackup.count({
      where: { caseId },
    })

    if (!backup) {
      return NextResponse.json({
        hasBackup: false,
        lastBackupAt: null,
        backupCount: 0,
        dataSize: null,
        version: null,
      })
    }

    return NextResponse.json({
      hasBackup: true,
      lastBackupAt: backup.updatedAt,
      backupCount,
      dataSize: backup.data.length,
      version: backup.version,
    })
  } catch (error) {
    console.error('Error fetching backup status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch backup status' },
      { status: 500 }
    )
  }
}
