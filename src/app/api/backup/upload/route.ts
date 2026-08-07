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

    // Create the new backup record
    const backup = await db.cloudBackup.create({
      data: {
        caseId,
        data,
        version: version || '1.0.0',
      },
    })

    // Delete old backups for the same caseId, keeping only the 5 most recent
    const backups = await db.cloudBackup.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (backups.length > 5) {
      const idsToDelete = backups.slice(5).map((b) => b.id)
      await db.cloudBackup.deleteMany({
        where: { id: { in: idsToDelete } },
      })
    }

    return NextResponse.json({ success: true, id: backup.id })
  } catch (error) {
    console.error('Error uploading backup:', error)
    return NextResponse.json(
      { error: 'Failed to upload backup' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
