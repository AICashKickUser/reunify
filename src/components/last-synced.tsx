'use client'

import { useState, useEffect, useCallback } from 'react'
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react'
import { forceBackup, getBackupStatus, type BackupStatus } from '@/lib/cloud-backup'
import { toast } from 'sonner'

interface LastSyncedProps {
  caseId: string | null
  compact?: boolean
}

export function LastSynced({ caseId, compact = false }: LastSyncedProps) {
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  // Refresh status periodically
  const refreshStatus = useCallback(() => {
    if (!caseId) {
      setStatus(null)
      return
    }
    const currentStatus = getBackupStatus(caseId)
    setStatus(currentStatus)
  }, [caseId])

  useEffect(() => {
    refreshStatus()
    // Refresh every 30 seconds
    const interval = setInterval(refreshStatus, 30000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  const handleForceSync = useCallback(async () => {
    if (!caseId || syncing) return

    setSyncing(true)
    setJustSynced(false)
    try {
      const result = await forceBackup(caseId)
      if (result.success) {
        setJustSynced(true)
        refreshStatus()
        toast.success('Cloud backup synced!', {
          description: 'Your data has been safely backed up.',
          duration: 3000,
        })
        setTimeout(() => setJustSynced(false), 3000)
      } else {
        toast.error('Sync failed', {
          description: result.error || 'Could not backup your data. Please try again.',
        })
      }
    } catch {
      toast.error('Sync failed', { description: 'Network error. Please check your connection.' })
    } finally {
      setSyncing(false)
    }
  }, [caseId, syncing, refreshStatus])

  // Don't show without a case
  if (!caseId) return null

  // Determine dot color
  const dotColor = status?.hasNeverSynced
    ? 'bg-red-500'
    : status?.isStale
      ? 'bg-yellow-500'
      : 'bg-emerald-500'

  const dotPulse = status?.hasNeverSynced ? 'animate-pulse' : ''

  // Icon
  const SyncIcon = syncing
    ? RefreshCw
    : justSynced
      ? Check
      : status?.hasNeverSynced
        ? CloudOff
        : Cloud

  if (compact) {
    return (
      <button
        onClick={handleForceSync}
        disabled={syncing}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        title={status?.hasNeverSynced ? 'Never synced — click to sync' : status?.lastBackupAgo ? `Last synced: ${status.lastBackupAgo}` : 'Sync now'}
      >
        <span className={`size-2 rounded-full ${dotColor} ${dotPulse} shrink-0`} />
        <SyncIcon className={`size-3.5 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
        <span className="truncate">
          {syncing ? 'Syncing...' : justSynced ? 'Synced!' : status?.lastBackupAgo || 'Not synced'}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={handleForceSync}
      disabled={syncing}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs w-full"
      title="Click to force sync now"
    >
      <span className={`size-2.5 rounded-full ${dotColor} ${dotPulse} shrink-0`} />
      <SyncIcon className={`size-3.5 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
      <span className="truncate text-muted-foreground">
        {syncing ? 'Syncing...' : justSynced ? 'Synced!' : status?.hasNeverSynced ? 'Not yet synced' : `Last synced: ${status?.lastBackupAgo ?? 'unknown'}`}
      </span>
    </button>
  )
}
