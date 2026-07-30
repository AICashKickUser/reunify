'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { autoBackup } from '@/lib/cloud-backup'
import { useSubscriptionStore } from '@/lib/subscription'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

/**
 * Auto-backup hook that monitors data changes via TanStack Query cache
 * and triggers auto-backup after changes (debounced, 5 min minimum interval).
 * Only backs up when online and for Pro users.
 */
export function useAutoBackup() {
  const queryClient = useQueryClient()
  const { tier } = useSubscriptionStore()
  const { activeCaseId } = useAppStore()
  const isPro = tier === 'pro'
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isBackingUpRef = useRef(false)

  const triggerAutoBackup = useCallback(async (caseId: string) => {
    if (!isPro || isBackingUpRef.current) return
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
  }, [isPro])

  useEffect(() => {
    if (!isPro || !activeCaseId) return

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

        // Debounce: wait 2 seconds after last change, then trigger auto-backup
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
          triggerAutoBackup(activeCaseId)
        }, 2000)
      }
    })

    // Listen for online events to trigger pending backup
    const handleOnline = () => {
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
  }, [isPro, activeCaseId, queryClient, triggerAutoBackup])
}
