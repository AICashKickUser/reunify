'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCourtDates, useDrugTests } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'

const NOTIFICATION_KEY = 'reunify-notifications-enabled'
const SHOWN_KEY = 'reunify-notifications-shown'

interface UpcomingEvent {
  id: string
  title: string
  date: Date
  type: 'court-date' | 'drug-test'
}

function getNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(NOTIFICATION_KEY) === 'true'
}

export function setNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(NOTIFICATION_KEY, enabled ? 'true' : 'false')
}

/** Get IDs of notifications we've already shown (to avoid duplicates) */
function getShownIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    if (!raw) return new Set()
    // Parse and filter out entries older than 7 days
    const entries = JSON.parse(raw) as Array<{ id: string; ts: number }>
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    const recent = entries.filter((e) => e.ts > cutoff)
    return new Set(recent.map((e) => e.id))
  } catch {
    return new Set()
  }
}

function markShown(id: string): void {
  try {
    const raw = localStorage.getItem(SHOWN_KEY)
    const entries: Array<{ id: string; ts: number }> = raw ? JSON.parse(raw) : []
    entries.push({ id, ts: Date.now() })
    // Keep only last 100
    const trimmed = entries.slice(-100)
    localStorage.setItem(SHOWN_KEY, JSON.stringify(trimmed))
  } catch {
    // ignore
  }
}

/**
 * Format a date as a human-friendly string: "Today", "Tomorrow", "in 3 days", "Jun 15"
 */
function formatRelativeDate(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays > 1 && diffDays <= 7) return `in ${diffDays} days`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Show a browser notification via the service worker.
 */
async function showNotification(title: string, body: string, tag: string): Promise<void> {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, {
          body,
          tag,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: false,
          silent: false,
        })
        return
      }
    }
    // Fallback to regular Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, tag, icon: '/icons/icon-192x192.png' })
    }
  } catch {
    // Notification failed — not critical, silently ignore
  }
}

/**
 * Main hook: checks for upcoming court dates and drug tests,
 * shows browser notifications and in-app toasts.
 */
export function useNotifications() {
  const { activeCaseId } = useAppStore()
  const { data: courtDates } = useCourtDates(activeCaseId)
  const { data: drugTests } = useDrugTests(activeCaseId)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCheckedRef = useRef(false)

  const checkAndNotify = useCallback(() => {
    if (!getNotificationsEnabled()) return
    if (!courtDates && !drugTests) return

    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const shownIds = getShownIds()

    const upcoming: UpcomingEvent[] = []

    // Check court dates
    if (courtDates) {
      for (const cd of courtDates) {
        if (cd.isCompleted) continue
        const date = new Date(cd.date)
        if (date >= now && date <= in7Days) {
          upcoming.push({
            id: `court-${cd.id}`,
            title: cd.hearingType ? `Court: ${cd.hearingType}` : 'Court date coming up',
            date,
            type: 'court-date',
          })
        }
      }
    }

    // Check drug tests (scheduled but not tested)
    if (drugTests) {
      for (const dt of drugTests) {
        if (dt.tested) continue
        const date = new Date(dt.date)
        if (date >= now && date <= in7Days) {
          upcoming.push({
            id: `drug-${dt.id}`,
            title: 'Drug test scheduled',
            date,
            type: 'drug-test',
          })
        }
      }
    }

    // Sort by date (soonest first)
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Show notifications for events that haven't been shown yet
    for (const event of upcoming) {
      if (shownIds.has(event.id)) continue

      const relative = formatRelativeDate(event.date)

      // Only show browser notification for events within 3 days
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      if (event.date <= in3Days) {
        const urgency = relative === 'Today' ? ' TODAY' : relative === 'Tomorrow' ? ' TOMORROW' : ''
        showNotification(
          `Reunify: ${event.title}${urgency}`,
          `You have a ${event.type === 'court-date' ? 'court date' : 'drug test'} ${relative}. Don't forget!`,
          event.id,
        )
        markShown(event.id)
      }
    }
  }, [courtDates, drugTests])

  // Check on mount and every 30 minutes while app is open
  useEffect(() => {
    if (!getNotificationsEnabled()) return

    // Initial check (delayed 5s to let data load)
    const initialTimer = setTimeout(() => {
      checkAndNotify()
      hasCheckedRef.current = true
    }, 5000)

    // Periodic check every 30 minutes
    checkIntervalRef.current = setInterval(checkAndNotify, 30 * 60 * 1000)

    return () => {
      clearTimeout(initialTimer)
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
    }
  }, [checkAndNotify])

  // Re-check when data changes (if we haven't checked yet)
  useEffect(() => {
    if (!hasCheckedRef.current && getNotificationsEnabled() && (courtDates || drugTests)) {
      const timer = setTimeout(checkAndNotify, 2000)
      return () => clearTimeout(timer)
    }
  }, [courtDates, drugTests, checkAndNotify])
}

/**
 * Request notification permission from the browser.
 * Returns 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    setNotificationsEnabled(true)
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  const result = await Notification.requestPermission()
  if (result === 'granted') {
    setNotificationsEnabled(true)
  }
  return result
}

/**
 * Get current notification permission status.
 */
export function getNotificationStatus(): {
  supported: boolean
  permission: NotificationPermission
  enabled: boolean
} {
  const supported = typeof window !== 'undefined' && 'Notification' in window
  return {
    supported,
    permission: supported ? Notification.permission : 'denied',
    enabled: getNotificationsEnabled(),
  }
}

/**
 * Get a summary of upcoming events for the notifications settings UI.
 */
export function useUpcomingEvents() {
  const { activeCaseId } = useAppStore()
  const { data: courtDates } = useCourtDates(activeCaseId)
  const { data: drugTests } = useDrugTests(activeCaseId)

  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const events: UpcomingEvent[] = []

  if (courtDates) {
    for (const cd of courtDates) {
      if (cd.isCompleted) continue
      const date = new Date(cd.date)
      if (date >= now && date <= in7Days) {
        events.push({
          id: `court-${cd.id}`,
          title: cd.hearingType ? `Court: ${cd.hearingType}` : 'Court date',
          date,
          type: 'court-date',
        })
      }
    }
  }

  if (drugTests) {
    for (const dt of drugTests) {
      if (dt.tested) continue
      const date = new Date(dt.date)
      if (date >= now && date <= in7Days) {
        events.push({
          id: `drug-${dt.id}`,
          title: 'Drug test',
          date,
          type: 'drug-test',
        })
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime())
  return events
}
