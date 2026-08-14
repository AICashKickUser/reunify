'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useCourtDates, useDrugTests, useCounselingSessions, useSupervisedVisits, useParentingClasses, useNAMeetings } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'

const NOTIFICATION_KEY = 'reunify-notifications-enabled'
const SHOWN_KEY = 'reunify-notifications-shown'

interface UpcomingEvent {
  id: string
  title: string
  date: Date
  type: 'court-date' | 'drug-test' | 'counseling' | 'supervised-visit' | 'parenting-class' | 'na-meeting' | 'drug-test-call'
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

/** Friendly label for event types */
function eventTypeLabel(type: UpcomingEvent['type']): string {
  switch (type) {
    case 'court-date': return 'court date'
    case 'drug-test': return 'drug test'
    case 'drug-test-call': return 'drug test call'
    case 'counseling': return 'counseling session'
    case 'supervised-visit': return 'supervised visit'
    case 'parenting-class': return 'parenting class'
    case 'na-meeting': return 'NA/AA meeting'
  }
}

/**
 * Main hook: checks for upcoming court dates, drug tests, counseling sessions,
 * supervised visits, parenting classes, and NA meetings.
 * Shows browser notifications and in-app toasts for events within 3 days.
 * Also reminds about daily drug test facility calls.
 */
export function useNotifications() {
  const { activeCaseId } = useAppStore()
  const { data: courtDates } = useCourtDates(activeCaseId)
  const { data: drugTests } = useDrugTests(activeCaseId)
  const { data: counselingSessions } = useCounselingSessions(activeCaseId)
  const { data: supervisedVisits } = useSupervisedVisits(activeCaseId)
  const { data: parentingClasses } = useParentingClasses(activeCaseId)
  const { data: naMeetings } = useNAMeetings(activeCaseId)
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCheckedRef = useRef(false)

  const checkAndNotify = useCallback(() => {
    if (!getNotificationsEnabled()) return

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
          // Drug test call reminder — if call hasn't been made yet
          if (!dt.callMade) {
            upcoming.push({
              id: `drug-call-${dt.id}`,
              title: 'Call for drug testing',
              date,
              type: 'drug-test-call',
            })
          }
        }
      }
    }

    // Check counseling sessions
    if (counselingSessions) {
      for (const cs of counselingSessions) {
        if (cs.isCompleted) continue
        const date = new Date(cs.date)
        if (date >= now && date <= in7Days) {
          upcoming.push({
            id: `counseling-${cs.id}`,
            title: cs.sessionType ? `Counseling: ${cs.sessionType}` : 'Counseling session',
            date,
            type: 'counseling',
          })
        }
      }
    }

    // Check supervised visits
    if (supervisedVisits) {
      for (const sv of supervisedVisits) {
        if (sv.isCompleted) continue
        const date = new Date(sv.date)
        if (date >= now && date <= in7Days) {
          upcoming.push({
            id: `visit-${sv.id}`,
            title: sv.visitType ? `Visit: ${sv.visitType}` : 'Supervised visit',
            date,
            type: 'supervised-visit',
          })
        }
      }
    }

    // Check parenting classes
    if (parentingClasses) {
      for (const pc of parentingClasses) {
        if (pc.isCompleted) continue
        const date = new Date(pc.date)
        if (date >= now && date <= in7Days) {
          upcoming.push({
            id: `parenting-${pc.id}`,
            title: pc.className ? `Parenting: ${pc.className}` : 'Parenting class',
            date,
            type: 'parenting-class',
          })
        }
      }
    }

    // Check NA/AA meetings
    if (naMeetings) {
      for (const nm of naMeetings) {
        const date = new Date(nm.date)
        if (date >= now && date <= in7Days) {
          upcoming.push({
            id: `na-meeting-${nm.id}`,
            title: nm.meetingName ? `Meeting: ${nm.meetingName}` : 'NA/AA meeting',
            date,
            type: 'na-meeting',
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
        const typeLabel = eventTypeLabel(event.type)

        if (event.type === 'drug-test-call') {
          showNotification(
            `Reunify: Call testing facility${urgency}`,
            `Don't forget to call your drug testing line ${relative} to check if you need to test.`,
            event.id,
          )
        } else if (event.type === 'supervised-visit') {
          showNotification(
            `Reunify: ${event.title}${urgency}`,
            `You have a supervised visit ${relative}. Be present and engaged!`,
            event.id,
          )
        } else if (event.type === 'counseling') {
          showNotification(
            `Reunify: ${event.title}${urgency}`,
            `You have a counseling session ${relative}. Keep showing up!`,
            event.id,
          )
        } else if (event.type === 'parenting-class') {
          showNotification(
            `Reunify: ${event.title}${urgency}`,
            `You have a parenting class ${relative}. Every class counts!`,
            event.id,
          )
        } else if (event.type === 'na-meeting') {
          showNotification(
            `Reunify: ${event.title}${urgency}`,
            `You have an NA/AA meeting ${relative}. Recovery works one day at a time.`,
            event.id,
          )
        } else {
          showNotification(
            `Reunify: ${event.title}${urgency}`,
            `You have a ${typeLabel} ${relative}. Don't forget!`,
            event.id,
          )
        }
        markShown(event.id)
      }
    }
  }, [courtDates, drugTests, counselingSessions, supervisedVisits, parentingClasses, naMeetings])

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
    if (!hasCheckedRef.current && getNotificationsEnabled() && (courtDates || drugTests || counselingSessions || supervisedVisits || parentingClasses || naMeetings)) {
      const timer = setTimeout(checkAndNotify, 2000)
      return () => clearTimeout(timer)
    }
  }, [courtDates, drugTests, counselingSessions, supervisedVisits, parentingClasses, naMeetings, checkAndNotify])
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
  const { data: counselingSessions } = useCounselingSessions(activeCaseId)
  const { data: supervisedVisits } = useSupervisedVisits(activeCaseId)
  const { data: parentingClasses } = useParentingClasses(activeCaseId)
  const { data: naMeetings } = useNAMeetings(activeCaseId)

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
        if (!dt.callMade) {
          events.push({
            id: `drug-call-${dt.id}`,
            title: 'Call for testing',
            date,
            type: 'drug-test-call',
          })
        }
      }
    }
  }

  if (counselingSessions) {
    for (const cs of counselingSessions) {
      if (cs.isCompleted) continue
      const date = new Date(cs.date)
      if (date >= now && date <= in7Days) {
        events.push({
          id: `counseling-${cs.id}`,
          title: cs.sessionType ? `Counseling: ${cs.sessionType}` : 'Counseling session',
          date,
          type: 'counseling',
        })
      }
    }
  }

  if (supervisedVisits) {
    for (const sv of supervisedVisits) {
      if (sv.isCompleted) continue
      const date = new Date(sv.date)
      if (date >= now && date <= in7Days) {
        events.push({
          id: `visit-${sv.id}`,
          title: sv.visitType ? `Visit: ${sv.visitType}` : 'Supervised visit',
          date,
          type: 'supervised-visit',
        })
      }
    }
  }

  if (parentingClasses) {
    for (const pc of parentingClasses) {
      if (pc.isCompleted) continue
      const date = new Date(pc.date)
      if (date >= now && date <= in7Days) {
        events.push({
          id: `parenting-${pc.id}`,
          title: pc.className ? `Parenting: ${pc.className}` : 'Parenting class',
          date,
          type: 'parenting-class',
        })
      }
    }
  }

  if (naMeetings) {
    for (const nm of naMeetings) {
      const date = new Date(nm.date)
      if (date >= now && date <= in7Days) {
        events.push({
          id: `na-meeting-${nm.id}`,
          title: nm.meetingName ? `Meeting: ${nm.meetingName}` : 'NA/AA meeting',
          date,
          type: 'na-meeting',
        })
      }
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime())
  return events
}
