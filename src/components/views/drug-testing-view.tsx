'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useDrugTests,
  useCreateItem,
  useUpdateItem,
} from '@/lib/data-hooks'
import { CATEGORY_COLORS } from '@/lib/types'
import type { DrugTest } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TestTube2,
  CheckCircle2,
  AlertTriangle,
  Phone,
  PhoneCall,
  Calendar,
  Flame,
  TrendingUp,
  Clock,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  PhoneOff,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const FULL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const
const RESULT_OPTIONS = [
  { value: 'negative', label: 'Negative (Clean)', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  { value: 'positive', label: 'Positive', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { value: 'diluted', label: 'Diluted', icon: TestTube2, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
] as const

type CallStatus = 'not-called' | 'not-required' | 'called-tested'

// ─── Date Helpers ─────────────────────────────────────────────────────────────

/** Get the Monday of the week containing the given date */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Sunday = 0, Monday = 1, etc.
  // If Sunday, go back 6 days; otherwise go back (day - 1) days
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Get Mon-Fri dates for a given week (anchored on Monday) */
function getWeekDates(monday: Date): Date[] {
  return DAY_NAMES.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

/** Format date as YYYY-MM-DD for API comparison */
function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Format date for display: "Mon Jul 21" */
function formatDayLabel(date: Date, dayName: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dayName} ${months[date.getMonth()]} ${date.getDate()}`
}

/** Format date range: "Jul 21 – Jul 25" */
function formatWeekRange(monday: Date, friday: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const m1 = months[monday.getMonth()]
  const m2 = months[friday.getMonth()]
  if (m1 === m2) {
    return `${m1} ${monday.getDate()} – ${friday.getDate()}`
  }
  return `${m1} ${monday.getDate()} – ${m2} ${friday.getDate()}`
}

/** Get the call status from a DrugTest entry */
function getCallStatus(test: DrugTest | undefined): CallStatus {
  if (!test) return 'not-called'
  if (!test.callMade) return 'not-called'
  if (test.callResult === 'not-required') return 'not-required'
  if (test.callResult === 'required' && test.tested) return 'called-tested'
  // Edge case: called, was required, but hasn't tested yet - still show as not-called
  // to remind them they need to go test
  if (test.callResult === 'required' && !test.tested) return 'not-called'
  return 'not-called'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DrugTestingView() {
  const { activeCaseId } = useAppStore()
  const { data: drugTests, isLoading } = useDrugTests(activeCaseId)
  const createMutation = useCreateItem('drug-tests')
  const updateMutation = useUpdateItem('drug-tests')

  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const [previousWeeksExpanded, setPreviousWeeksExpanded] = useState(true)

  // ─── Current Week ────────────────────────────────────────────────────────

  const currentMonday = useMemo(() => getMondayOfWeek(new Date()), [])
  const currentWeekDates = useMemo(() => getWeekDates(currentMonday), [currentMonday])
  const currentFriday = currentWeekDates[4]

  // ─── Build lookup map: dateKey -> DrugTest ────────────────────────────────

  const testByDate = useMemo(() => {
    const map = new Map<string, DrugTest>()
    if (!drugTests) return map
    for (const test of drugTests) {
      // The API returns date as ISO string; parse it and get the local date key
      const d = new Date(test.date)
      const key = formatDateKey(d)
      // If multiple entries for same date, prefer the most recent
      const existing = map.get(key)
      if (!existing || new Date(test.updatedAt) > new Date(existing.updatedAt)) {
        map.set(key, test)
      }
    }
    return map
  }, [drugTests])

  // ─── Previous Weeks ──────────────────────────────────────────────────────

  const previousWeeks = useMemo(() => {
    const weeks: { monday: Date; friday: Date; tests: DrugTest[] }[] = []
    // Generate up to 8 previous weeks
    for (let i = 1; i <= 8; i++) {
      const prevMonday = new Date(currentMonday)
      prevMonday.setDate(currentMonday.getDate() - 7 * i)
      const prevDates = getWeekDates(prevMonday)
      const prevFriday = prevDates[4]

      const weekTests: DrugTest[] = []
      for (const d of prevDates) {
        const test = testByDate.get(formatDateKey(d))
        if (test) weekTests.push(test)
      }

      // Only include weeks that have at least one test entry
      if (weekTests.length > 0) {
        weeks.push({ monday: prevMonday, friday: prevFriday, tests: weekTests })
      }
    }
    return weeks
  }, [currentMonday, testByDate])

  // ─── Stats ───────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!drugTests) return { cleanTests: 0, totalTests: 0, daysCalledThisWeek: 0, streak: 0, totalCompleted: 0 }

    // Total tests where the person actually went and tested
    const testedEntries = drugTests.filter(t => t.tested)
    const totalTests = testedEntries.length

    // Clean tests = tested + result is negative
    const cleanTests = testedEntries.filter(t => t.result === 'negative').length

    // Days called this week (Mon-Fri of current week)
    let daysCalledThisWeek = 0
    for (const d of currentWeekDates) {
      const test = testByDate.get(formatDateKey(d))
      if (test && test.callMade) daysCalledThisWeek++
    }

    // Streak: consecutive days with clean results, counting backward from today
    // A "streak day" is a day where: called AND (not-required OR tested-negative)
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from today or yesterday (depending on if today has data), go backward
    const startDate = new Date(today)
    // Go back up to 60 days to calculate streak
    for (let i = 0; i < 60; i++) {
      const checkDate = new Date(startDate)
      checkDate.setDate(startDate.getDate() - i)
      // Only count weekdays (Mon-Fri)
      const dayOfWeek = checkDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      const key = formatDateKey(checkDate)
      const test = testByDate.get(key)
      if (!test) break // No data = streak ends

      if (!test.callMade) break // Didn't call = streak ends

      if (test.callResult === 'not-required') {
        // Called and not required = still counts as a "clean day" for streak
        streak++
      } else if (test.callResult === 'required' && test.tested && test.result === 'negative') {
        // Tested and clean = streak continues
        streak++
      } else if (test.callResult === 'required' && test.tested && test.result === 'pending') {
        // Pending result - count it but it's uncertain
        streak++
      } else {
        // Positive, diluted, or was required but didn't test = streak breaks
        break
      }
    }

    const totalCompleted = drugTests.filter(t => t.callMade).length

    return {
      cleanTests,
      totalTests,
      daysCalledThisWeek,
      streak,
      totalCompleted,
    }
  }, [drugTests, testByDate, currentWeekDates])

  // ─── Handler: Update call status for a day ───────────────────────────────

  const handleStatusChange = useCallback(
    (date: Date, newStatus: CallStatus) => {
      if (!activeCaseId) return

      const key = formatDateKey(date)
      const existing = testByDate.get(key)

      // Determine the mutation payload based on the new status
      let payload: Record<string, unknown>

      if (newStatus === 'not-called') {
        // Reset back to "not called" state
        payload = {
          callMade: false,
          callResult: null,
          tested: false,
          result: null,
          isRandom: false,
        }
      } else if (newStatus === 'not-required') {
        // Called hotline, told not to test
        payload = {
          callMade: true,
          callResult: 'not-required',
          tested: false,
          result: null,
          isRandom: false,
          testType: 'urine',
        }
      } else {
        // Called & tested
        payload = {
          callMade: true,
          callResult: 'required',
          tested: true,
          result: 'pending',
          isRandom: true,
          testType: 'urine',
        }
        // Auto-expand result options for this day
        setExpandedResults(prev => new Set([...prev, key]))
      }

      if (existing) {
        // Update existing entry
        updateMutation.mutate(
          { id: existing.id, ...payload },
          {
            onSuccess: () => {
              const label = newStatus === 'not-required' ? 'Called — Not Required' : newStatus === 'called-tested' ? 'Called & Tested' : 'Reset'
              toast.success(`${DAY_NAMES[currentWeekDates.findIndex(d => formatDateKey(d) === key)]}: ${label}`)
            },
            onError: () => toast.error('Failed to update — please try again'),
          }
        )
      } else {
        // Create new entry
        createMutation.mutate(
          {
            caseId: activeCaseId,
            date: key,
            ...payload,
          },
          {
            onSuccess: () => {
              const label = newStatus === 'not-required' ? 'Called — Not Required' : 'Called & Tested'
              toast.success(`${DAY_NAMES[currentWeekDates.findIndex(d => formatDateKey(d) === key)]}: ${label}`)
            },
            onError: () => toast.error('Failed to save — please try again'),
          }
        )
      }
    },
    [activeCaseId, testByDate, createMutation, updateMutation, currentWeekDates]
  )

  // ─── Handler: Update test result ─────────────────────────────────────────

  const handleResultChange = useCallback(
    (date: Date, result: string) => {
      if (!activeCaseId) return

      const key = formatDateKey(date)
      const existing = testByDate.get(key)

      if (existing) {
        updateMutation.mutate(
          { id: existing.id, result },
          {
            onSuccess: () => {
              const resultLabel = RESULT_OPTIONS.find(r => r.value === result)?.label ?? result
              toast.success(`Result updated: ${resultLabel}`)
            },
            onError: () => toast.error('Failed to update result'),
          }
        )
      }
    },
    [activeCaseId, testByDate, updateMutation]
  )

  // ─── Toggle result expansion ─────────────────────────────────────────────

  const toggleExpanded = (key: string) => {
    setExpandedResults(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ─── Is today in the current week? ───────────────────────────────────────

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const isFutureDay = (date: Date) => date > today

  // ─── Render: Loading ─────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    )
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <TestTube2 className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Drug Testing Call Log</h2>
          <p className="text-sm text-muted-foreground">Call the hotline each day. Log your call status here.</p>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Clean Tests */}
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Clean Tests</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {stats.totalTests > 0 ? `${stats.cleanTests}/${stats.totalTests}` : '0'}
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              {stats.totalTests > 0 ? `${Math.round((stats.cleanTests / stats.totalTests) * 100)}%` : 'No tests yet'}
            </p>
          </CardContent>
        </Card>

        {/* Days Called This Week */}
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <PhoneCall className="size-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Days Called</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.daysCalledThisWeek}/5
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">this week</p>
          </CardContent>
        </Card>

        {/* Testing Streak */}
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Flame className="size-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Streak</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.streak}
            </p>
            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">consecutive clean days</p>
          </CardContent>
        </Card>

        {/* Total Tests */}
        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ClipboardCheck className="size-4 text-slate-600" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-400">Total Tests</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300">
              {stats.totalTests}
            </p>
            <p className="text-xs text-slate-600/70 dark:text-slate-400/70">completed</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Weekly Compliance Bar ──────────────────────────────────────── */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-amber-600" />
              <span className="text-sm font-medium text-foreground">Weekly Call Compliance</span>
            </div>
            <Badge
              variant={stats.daysCalledThisWeek === 5 ? 'default' : 'outline'}
              className={
                stats.daysCalledThisWeek === 5
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : stats.daysCalledThisWeek >= 3
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700'
              }
            >
              {stats.daysCalledThisWeek === 5 ? '5/5 — Perfect!' : `${stats.daysCalledThisWeek}/5 days`}
            </Badge>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(stats.daysCalledThisWeek / 5) * 100}%`,
                backgroundColor:
                  stats.daysCalledThisWeek === 5 ? '#059669' :
                  stats.daysCalledThisWeek >= 3 ? '#d97706' :
                  '#dc2626',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {stats.daysCalledThisWeek === 5
              ? 'You called every day this week — great job!'
              : stats.daysCalledThisWeek === 0
              ? 'Call the hotline each day (Mon–Fri) to stay compliant.'
              : `${5 - stats.daysCalledThisWeek} days left this week — keep calling!`}
          </p>
        </CardContent>
      </Card>

      {/* ── This Week's Call Grid ──────────────────────────────────────── */}
      <Card className={`${CATEGORY_COLORS['drug-testing'].border}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-amber-700 dark:text-amber-400">
              This Week: {formatWeekRange(currentMonday, currentFriday)}
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              <span>Tap to log your daily call</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {currentWeekDates.map((date, dayIndex) => {
            const key = formatDateKey(date)
            const test = testByDate.get(key)
            const status = getCallStatus(test)
            const isToday = formatDateKey(date) === formatDateKey(today)
            const isFuture = isFutureDay(date)
            const isExpanded = expandedResults.has(key)

            return (
              <div key={key} className="space-y-1">
                {/* Day Row */}
                <div
                  className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-lg transition-colors ${
                    isToday
                      ? 'bg-amber-100 dark:bg-amber-900/20 ring-1 ring-amber-300 dark:ring-amber-700'
                      : status === 'not-called'
                      ? 'bg-gray-50 dark:bg-gray-900/10'
                      : status === 'not-required'
                      ? 'bg-emerald-50 dark:bg-emerald-950/10'
                      : 'bg-amber-50 dark:bg-amber-950/10'
                  }`}
                >
                  {/* Day Label */}
                  <div className="flex-shrink-0 min-w-[70px] sm:min-w-[100px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-sm font-semibold ${isToday ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'}`}>
                        {DAY_NAMES[dayIndex]}
                      </span>
                      {isToday && (
                        <Badge className="bg-amber-600 text-white border-amber-600 text-[10px] px-1 py-0 h-4">
                          Today
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {date.getMonth() + 1}/{date.getDate()}
                    </span>
                  </div>

                  {/* Quick-Action Buttons */}
                  <div className="flex-1 flex items-center gap-1.5 sm:gap-2">
                    {isFuture ? (
                      <div className="flex-1 text-center py-2 text-xs text-muted-foreground italic">
                        Future day — check back {DAY_NAMES[dayIndex]} morning
                      </div>
                    ) : (
                      <>
                        {/* Not Called */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                          onClick={() => handleStatusChange(date, 'not-called')}
                          className={`flex-1 h-10 sm:h-11 text-xs sm:text-sm transition-all ${
                            status === 'not-called'
                              ? 'bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 ring-2 ring-gray-400/50'
                              : 'bg-transparent text-gray-400 border-gray-200 dark:text-gray-500 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20'
                          }`}
                        >
                          <PhoneOff className="size-3.5 sm:size-4 mr-1" />
                          Not Called
                        </Button>

                        {/* Called — Not Required */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                          onClick={() => handleStatusChange(date, 'not-required')}
                          className={`flex-1 h-10 sm:h-11 text-xs sm:text-sm transition-all ${
                            status === 'not-required'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 ring-2 ring-emerald-400/50'
                              : 'bg-transparent text-gray-400 border-gray-200 dark:text-gray-500 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 hover:text-emerald-600 hover:border-emerald-200 dark:hover:text-emerald-400'
                          }`}
                        >
                          <CheckCircle2 className="size-3.5 sm:size-4 mr-1" />
                          <span className="hidden sm:inline">Called — Not Required</span>
                          <span className="sm:hidden">Not Req.</span>
                        </Button>

                        {/* Called & Tested */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isMutating}
                          onClick={() => handleStatusChange(date, 'called-tested')}
                          className={`flex-1 h-10 sm:h-11 text-xs sm:text-sm transition-all ${
                            status === 'called-tested'
                              ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 ring-2 ring-amber-400/50'
                              : 'bg-transparent text-gray-400 border-gray-200 dark:text-gray-500 dark:border-gray-700 hover:bg-amber-50 dark:hover:bg-amber-950/10 hover:text-amber-600 hover:border-amber-200 dark:hover:text-amber-400'
                          }`}
                        >
                          <TestTube2 className="size-3.5 sm:size-4 mr-1" />
                          <span className="hidden sm:inline">Called & Tested</span>
                          <span className="sm:hidden">Tested</span>
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Expand toggle for tested days */}
                  {status === 'called-tested' && test && (
                    <button
                      onClick={() => toggleExpanded(key)}
                      className="flex-shrink-0 p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                      aria-label={isExpanded ? 'Collapse result options' : 'Expand result options'}
                    >
                      <ChevronDown
                        className={`size-4 text-amber-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  )}
                </div>

                {/* Expanded Result Options (only for "Called & Tested") */}
                {status === 'called-tested' && test && isExpanded && (
                  <div className="ml-[70px] sm:ml-[100px] p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">
                      Test Result:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {RESULT_OPTIONS.map(opt => {
                        const isSelected = test.result === opt.value
                        return (
                          <Button
                            key={opt.value}
                            variant="outline"
                            size="sm"
                            disabled={isMutating}
                            onClick={() => handleResultChange(date, opt.value)}
                            className={`h-9 text-xs transition-all ${
                              isSelected
                                ? `${opt.bg} ${opt.color} ring-2 ring-current/30 font-semibold`
                                : 'text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/10'
                            }`}
                          >
                            <opt.icon className="size-3.5 mr-1" />
                            {opt.value === 'negative' ? 'Clean' : opt.label.split(' ')[0]}
                          </Button>
                        )
                      })}
                    </div>
                    {test.result === 'positive' && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="size-3.5" />
                        <span className="font-medium">Positive result — contact your caseworker immediately.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Compact result badge for tested days (when not expanded) */}
                {status === 'called-tested' && test && test.result && !isExpanded && (
                  <div className="ml-[70px] sm:ml-[100px]">
                    <Badge
                      className={
                        test.result === 'negative'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                          : test.result === 'positive'
                          ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                          : test.result === 'diluted'
                          ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                          : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                      }
                    >
                      {test.result === 'negative' ? '✓ Clean' : test.result === 'positive' ? '✗ Positive' : test.result === 'diluted' ? 'Diluted' : 'Pending'}
                    </Badge>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* ── Previous Weeks ─────────────────────────────────────────────── */}
      {previousWeeks.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <button
              onClick={() => setPreviousWeeksExpanded(!previousWeeksExpanded)}
              className="flex items-center justify-between w-full text-left"
              aria-label={previousWeeksExpanded ? 'Collapse previous weeks' : 'Expand previous weeks'}
            >
              <CardTitle className="text-base font-semibold text-foreground">
                Previous Weeks
              </CardTitle>
              {previousWeeksExpanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>

          {previousWeeksExpanded && (
            <CardContent className="space-y-3 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              {previousWeeks.map((week) => {
                const weekDateKeys = getWeekDates(week.monday).map(d => formatDateKey(d))
                const weekTestsMap = weekDateKeys.map(key => testByDate.get(key))

                // Week stats
                const calledDays = weekTestsMap.filter(t => t?.callMade).length
                const testedDays = weekTestsMap.filter(t => t?.tested).length
                const cleanDays = weekTestsMap.filter(t => t?.result === 'negative').length
                const positiveDays = weekTestsMap.filter(t => t?.result === 'positive').length
                const pendingDays = weekTestsMap.filter(t => t?.tested && t?.result === 'pending').length

                const complianceRate = Math.round((calledDays / 5) * 100)
                const cleanRate = testedDays > 0 ? Math.round((cleanDays / testedDays) * 100) : 0

                return (
                  <div
                    key={formatDateKey(week.monday)}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10"
                  >
                    {/* Week Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-slate-500" />
                        <span className="text-sm font-medium text-foreground">
                          {formatWeekRange(week.monday, week.friday)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            complianceRate === 100
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700'
                              : complianceRate >= 60
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-700'
                              : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-700'
                          }
                        >
                          {calledDays}/5 called
                        </Badge>
                        {cleanRate > 0 && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-700">
                            {cleanRate}% clean
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Mini Week Grid */}
                    <div className="grid grid-cols-5 gap-1">
                      {weekDateKeys.map((key, i) => {
                        const t = weekTestsMap[i]
                        const dayStatus = getCallStatus(t)

                        let cellBg = 'bg-gray-100 dark:bg-gray-800'
                        let cellText = 'text-gray-400'
                        let icon = <span className="text-[10px]">—</span>

                        if (dayStatus === 'not-called') {
                          cellBg = 'bg-gray-100 dark:bg-gray-800/50'
                          cellText = 'text-gray-400'
                          icon = <PhoneOff className="size-3" />
                        } else if (dayStatus === 'not-required') {
                          cellBg = 'bg-emerald-100 dark:bg-emerald-900/20'
                          cellText = 'text-emerald-600 dark:text-emerald-400'
                          icon = <CheckCircle2 className="size-3" />
                        } else if (dayStatus === 'called-tested') {
                          if (t?.result === 'negative') {
                            cellBg = 'bg-emerald-200 dark:bg-emerald-900/30'
                            cellText = 'text-emerald-700 dark:text-emerald-300'
                            icon = <CheckCircle2 className="size-3" />
                          } else if (t?.result === 'positive') {
                            cellBg = 'bg-red-200 dark:bg-red-900/30'
                            cellText = 'text-red-700 dark:text-red-300'
                            icon = <AlertTriangle className="size-3" />
                          } else if (t?.result === 'diluted') {
                            cellBg = 'bg-orange-200 dark:bg-orange-900/30'
                            cellText = 'text-orange-700 dark:text-orange-300'
                            icon = <TestTube2 className="size-3" />
                          } else {
                            cellBg = 'bg-amber-200 dark:bg-amber-900/30'
                            cellText = 'text-amber-700 dark:text-amber-300'
                            icon = <Clock className="size-3" />
                          }
                        }

                        return (
                          <div
                            key={key}
                            className={`flex flex-col items-center justify-center py-1.5 rounded ${cellBg} ${cellText}`}
                          >
                            <span className="text-[10px] font-medium leading-none mb-0.5">{DAY_NAMES[i]}</span>
                            {icon}
                          </div>
                        )
                      })}
                    </div>

                    {/* Week summary line */}
                    {positiveDays > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="size-3" />
                        <span>{positiveDays} positive result(s) this week</span>
                      </div>
                    )}
                    {pendingDays > 0 && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="size-3" />
                        <span>{pendingDays} result(s) still pending</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── How It Works (collapsed info) ──────────────────────────────── */}
      <Card className="border-dashed border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2">
            <PhoneCall className="size-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700/80 dark:text-amber-400/80 space-y-1">
              <p className="font-medium text-amber-800 dark:text-amber-300">How CPS Drug Testing Works:</p>
              <ol className="list-decimal ml-3 space-y-0.5">
                <li>Call the hotline every <strong>Monday through Friday</strong></li>
                <li>The operator tells you: &quot;Required to test&quot; or &quot;Not required today&quot;</li>
                <li>If required: go to the testing facility and give a urine sample</li>
                <li>If not required: you&apos;re done for the day — just log it here</li>
              </ol>
              <p className="italic">Tap a button above to log each day&apos;s call status. One tap is all it takes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
