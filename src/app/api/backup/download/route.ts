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

    if (!backup) {
      return NextResponse.json(
        { error: 'No backup found for this case' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: backup.data,
      version: backup.version,
      createdAt: backup.createdAt,
      updatedAt: backup.updatedAt,
      dataSize: backup.data.length,
    })
  } catch (error) {
    console.error('Error downloading backup:', error)
    return NextResponse.json(
      { error: 'Failed to download backup' },
      { status: 500 }
    )
  }
}
