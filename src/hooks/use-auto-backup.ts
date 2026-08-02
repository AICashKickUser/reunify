'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { autoBackup } from '@/lib/cloud-backup'
import { useAppStore } from '@/lib/store'
import { exportAllData } from '@/lib/client-db'
import { toast } from 'sonner'

const LOCAL_BACKUP_KEY = 'reunify-local-auto-backup'
const LOCAL_BACKUP_TIMESTAMP_KEY = 'reunify-local-auto-backup-timestamp'
const LOCAL_BACKUP_INTERVAL_MS = 60_000 // 1 minute minimum between local backups

/**
 * Save a snapshot of all IndexedDB data to localStorage as a safety net.
 * This runs for ALL users (not just Pro) and provides a last-resort recovery
 * mechanism if IndexedDB is wiped during an app update.
 */
async function saveLocalBackup() {
  try {
    const lastBackup = localStorage.getItem(LOCAL_BACKUP_TIMESTAMP_KEY)
    if (lastBackup) {
      const elapsed = Date.now() - parseInt(lastBackup, 10)
      if (elapsed < LOCAL_BACKUP_INTERVAL_MS) return // Don't backup too frequently
    }

    const data = await exportAllData()
    const serialized = JSON.stringify(data)

    // Check if localStorage has enough space (roughly 5MB limit)
    if (serialized.length < 4_000_000) {
      localStorage.setItem(LOCAL_BACKUP_KEY, serialized)
      localStorage.setItem(LOCAL_BACKUP_TIMESTAMP_KEY, Date.now().toString())
    }
    // If data is too large for localStorage, we skip silently
    // (Cloud backup is the solution for large datasets)
  } catch {
    // Silently fail — local backup is best-effort
  }
}

/**
 * Retrieve the last local auto-backup from localStorage.
 * Returns null if no backup exists.
 */
export function getLocalAutoBackup(): { data: unknown; timestamp: number } | null {
  try {
    const serialized = localStorage.getItem(LOCAL_BACKUP_KEY)
    const timestamp = localStorage.getItem(LOCAL_BACKUP_TIMESTAMP_KEY)
    if (!serialized || !timestamp) return null
    return {
      data: JSON.parse(serialized),
      timestamp: parseInt(timestamp, 10),
    }
  } catch {
    return null
  }
}

/**
 * Auto-backup hook that monitors data changes via TanStack Query cache
 * and triggers:
 * 1. Local localStorage backup for ALL users (safety net against data loss)
 * 2. Cloud auto-backup for Pro users (debounced, 5 min minimum interval)
 */
export function useAutoBackup() {
  const queryClient = useQueryClient()
  const { activeCaseId } = useAppStore()
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isBackingUpRef = useRef(false)

  const triggerAutoBackup = useCallback(async (caseId: string) => {
    if (isBackingUpRef.current) return
    if (typeof navigator !== 'undefined' && !navigator.onLine) return

    isBackingUpRef.current = true
    try {
      const result = await autoBackup(caseId)
      if (result.backedUp) {
        toast.success('Auto-backup complete', {
          description: 'Your data has been safely synced to the cloud.',
          duration: 3000,
        })
      }
    } catch {
      // Silently fail — auto-backup is best-effort
    } finally {
      isBackingUpRef.current = false
    }
  }, [])

  useEffect(() => {
    // Always save a local backup on mount (app open)
    saveLocalBackup()

    if (!activeCaseId) return

    // Listen for query cache changes (mutations invalidate queries)
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only trigger on successful mutations (updated/added/removed queries)
      if (event?.type === 'updated' && event.query.state.status === 'success') {
        // Only care about case-related queries
        const queryKey = event.query.queryKey as string[]
        const caseRelatedKeys = [
          'requirements', 'counseling', 'drug-tests', 'na-steps',
          'na-meetings', 'supervised-visits', 'court-dates',
          'parenting-classes', 'milestones', 'daily-checkins', 'case',
        ]

        const isRelevant = queryKey.some(key => caseRelatedKeys.includes(key as string))
        if (!isRelevant) return

        // Debounce: wait 2 seconds after last change, then trigger backups
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
          // Always save local backup (safety net for ALL users)
          saveLocalBackup()
          // Also trigger cloud backup
          if (activeCaseId) {
            triggerAutoBackup(activeCaseId)
          }
        }, 2000)
      }
    })

    // Listen for online events to trigger pending backup
    const handleOnline = () => {
      // Save local backup first
      saveLocalBackup()
      // Then trigger cloud backup
      if (activeCaseId) {
        triggerAutoBackup(activeCaseId)
      }
    }
    window.addEventListener('online', handleOnline)

    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [triggerAutoBackup])
}
