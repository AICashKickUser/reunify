'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useCase } from '@/lib/data-hooks'
import { useAppStore, type ViewType } from '@/lib/store'
import { CATEGORY_COLORS } from '@/lib/types'
import {
  CheckCircle2,
  ClipboardList,
  TestTube2,
  Footprints,
  Heart,
  Eye,
  CalendarDays,
  Sparkles,
  FlaskConical,
  MessageSquareHeart,
  CircleCheckBig,
  Clock,
  Gavel,
  Users,
  BookOpen,
  Flag,
  Activity,
  FileText,
  ArrowRight,
} from 'lucide-react'
import {
  format,
  differenceInDays,
  isToday,
  isTomorrow,
  isFuture,
  isWithinInterval,
  addDays,
  startOfDay,
} from 'date-fns'
import { parseLocalDate } from '@/lib/utils'
import { AchievementsSection } from '@/components/achievements-section'
import { StreakCard } from '@/components/streak-display'
import { getWeeklySummary, getStreakData, type WeeklySummary, type StreakData } from '@/lib/streaks'
interface TimelineEvent {
  id: string
  date: string
  type: string
  category: string
  title: string
  status: 'completed' | 'upcoming' | 'pending' | 'missed'
  icon: React.ReactNode
}

// --- Loading Skeleton ---
function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// --- Empty State ---
function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
        <Sparkles className="size-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Your Dashboard is Ready</h3>
      <p className="text-muted-foreground text-sm text-center max-w-sm">
        Once you add data to your case plan, your progress overview will appear here. Start by logging your first activity!
      </p>
    </div>
  )
}

// --- Stat Card ---
function StatCard({
  title,
  value,
  subtitle,
  progress,
  progressLabel,
  icon,
  colorClass,
  onClick,
}: {
  title: string
  value: string | number
  subtitle: string
  progress?: number
  progressLabel?: string
  icon: React.ReactNode
  colorClass: string
  onClick?: () => void
}) {
  const isClickable = !!onClick
  return (
    <Card 
      className={`relative overflow-hidden ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]' : ''}`}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
      <CardHeader className="pb-2 pl-4 sm:pl-5">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            {title}
          </CardDescription>
          <div className="flex items-center gap-1.5">
            {isClickable && <ArrowRight className="size-3 sm:size-3.5 text-muted-foreground/50" />}
            <div className={`flex size-6 sm:size-8 items-center justify-center rounded-lg ${colorClass} bg-opacity-10`}>
              {icon}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-4 sm:pl-5 space-y-2">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {progress !== undefined && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            {progressLabel && (
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Weekly Summary Card ---
function WeeklySummaryCard() {
  const [summary, setSummary] = useState<WeeklySummary | null>(() => {
    if (typeof window === 'undefined') return null
    try { return getWeeklySummary() } catch { return null }
  })
  const [streakData, setStreakData] = useState<StreakData | null>(() => {
    if (typeof window === 'undefined') return null
    try { return getStreakData() } catch { return null }
  })

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setSummary(getWeeklySummary())
        setStreakData(getStreakData())
      } catch { /* ignore */ }
    }
    window.addEventListener('streak-updated', handleUpdate)
    window.addEventListener('focus', handleUpdate)
    const interval = setInterval(handleUpdate, 60000)
    return () => {
      window.removeEventListener('streak-updated', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
      clearInterval(interval)
    }
  }, [])

  if (!summary || !streakData) return null

  const categoryLabels: Record<string, string> = {
    'check-in': 'Check-ins',
    'counseling': 'Counseling',
    'drug-test': 'Drug Tests',
    'na-meeting': 'NA Meetings',
    'na-step': 'NA Steps',
    'supervised-visit': 'Visits',
    'court-date': 'Court Dates',
    'parenting-class': 'Parenting',
    'milestone': 'Milestones',
    'requirement': 'Requirements',
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
      <CardHeader className="pb-2 pl-4 sm:pl-5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Activity className="size-3 sm:size-4 text-violet-600" />
            This Week&apos;s Activity
          </CardTitle>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              summary.streakMaintained
                ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
            }`}
          >
            {summary.streakMaintained ? '🔥 Streak active' : '💡 Log today'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pl-4 sm:pl-5 space-y-3">
        {/* Week day dots */}
        <div className="flex items-center justify-between gap-1">
          {weekDays.map((day, i) => {
            const isToday = new Date().getDay() === (i + 1) % 7 // Mon=0→1, Sun=6→0
            const active = i < streakData.thisWeekActive
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <div
                  className={`size-5 sm:size-6 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-medium transition-all ${
                    active
                      ? 'bg-emerald-500 text-white'
                      : isToday
                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-300 dark:ring-emerald-700'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {active ? '✓' : day.charAt(0)}
                </div>
                <span className={`text-[8px] sm:text-[9px] ${isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>

        {/* Activity breakdown */}
        {summary.totalActivities > 0 && (
          <div className="space-y-1.5">
            {Object.entries(summary.categories)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {categoryLabels[type] || type}
                  </span>
                  <span className="text-xs font-medium text-foreground">{count}</span>
                </div>
              ))}
          </div>
        )}

        {/* Summary stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
          <span>{summary.daysActive}/7 days active</span>
          <span>•</span>
          <span>{summary.totalActivities} activities</span>
        </div>

        {/* Motivational quote */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs text-emerald-800 dark:text-emerald-300 italic leading-relaxed">
            &ldquo;{summary.motivationalQuote}&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Main Dashboard ---
export function DashboardView() {
  const { activeCaseId, setActiveView } = useAppStore()
  const { data: caseData, isLoading } = useCase(activeCaseId)

  // Build unified timeline events
  const allEvents = useMemo<TimelineEvent[]>(() => {
    if (!caseData) return []

    try {
    const events: TimelineEvent[] = []

    // Safe date parser
    function safeParseDate(dateStr: string | null | undefined): Date | null {
      if (!dateStr) return null
      try {
        const d = parseLocalDate(dateStr)
        if (isNaN(d.getTime())) return null
        return d
      } catch {
        return null
      }
    }

    function safeEventStatus(dateStr: string | null | undefined, isCompleted: boolean): 'completed' | 'upcoming' | 'pending' {
      if (isCompleted) return 'completed'
      const d = safeParseDate(dateStr)
      if (!d) return 'pending'
      try {
        return isFuture(d) ? 'upcoming' : 'pending'
      } catch {
        return 'pending'
      }
    }

    // Counseling sessions
    const counselingSessions = Array.isArray(caseData.counselingSessions) ? caseData.counselingSessions : []
    counselingSessions.forEach((s) => {
      if (!s?.date) return
      try {
        events.push({
          id: s.id,
          date: s.date,
          type: 'counseling',
          category: 'counseling',
          title: `${s.sessionType || 'Counseling'} Session${s.counselorName ? ` with ${s.counselorName}` : ''}`,
          status: safeEventStatus(s.date, s.isCompleted),
          icon: <Heart className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    // Drug tests
    const drugTests = Array.isArray(caseData.drugTests) ? caseData.drugTests : []
    drugTests.forEach((t) => {
      if (!t?.date) return
      try {
        const resultLabel = t.result === 'negative' ? 'Negative' : t.result === 'positive' ? 'Positive' : t.result === 'diluted' ? 'Diluted' : 'Pending'
        events.push({
          id: t.id,
          date: t.date,
          type: 'drug-testing',
          category: 'drug-testing',
          title: `${t.testType || 'Drug'} Test — ${resultLabel}${t.isRandom ? ' (Random)' : ''}`,
          status: t.result ? 'completed' : 'upcoming',
          icon: <FlaskConical className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    // NA meetings
    const naMeetings = Array.isArray(caseData.naMeetings) ? caseData.naMeetings : []
    naMeetings.forEach((m) => {
      if (!m?.date) return
      try {
        events.push({
          id: m.id,
          date: m.date,
          type: 'na-meetings',
          category: 'na-meetings',
          title: `NA Meeting${m.meetingName ? `: ${m.meetingName}` : ''}${m.isVerified ? ' ✓ Verified' : ''}`,
          status: m.isVerified ? 'completed' : 'upcoming',
          icon: <Users className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    // Supervised visits
    const supervisedVisits = Array.isArray(caseData.supervisedVisits) ? caseData.supervisedVisits : []
    supervisedVisits.forEach((v) => {
      if (!v?.date) return
      try {
        events.push({
          id: v.id,
          date: v.date,
          type: 'supervised-visits',
          category: 'supervised-visits',
          title: `${v.visitType || 'Supervised'} Visit${v.supervisorName ? ` with ${v.supervisorName}` : ''}`,
          status: safeEventStatus(v.date, v.isCompleted),
          icon: <Eye className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    // Court dates
    const courtDates = Array.isArray(caseData.courtDates) ? caseData.courtDates : []
    courtDates.forEach((c) => {
      if (!c?.date) return
      try {
        events.push({
          id: c.id,
          date: c.date,
          type: 'legal',
          category: 'legal',
          title: `${c.hearingType || 'Court'} Hearing${c.outcome ? ` — ${c.outcome}` : ''}`,
          status: c.isCompleted ? 'completed' : 'upcoming',
          icon: <Gavel className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    // Parenting classes
    const parentingClasses = Array.isArray(caseData.parentingClasses) ? caseData.parentingClasses : []
    parentingClasses.forEach((p) => {
      if (!p?.date) return
      try {
        events.push({
          id: p.id,
          date: p.date,
          type: 'parenting-classes',
          category: 'parenting-classes',
          title: `Parenting Class${p.className ? `: ${p.className}` : ''}${p.hasCertificate ? ' 🏅' : ''}`,
          status: safeEventStatus(p.date, p.isCompleted),
          icon: <BookOpen className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    // Milestones
    const milestones = Array.isArray(caseData.milestones) ? caseData.milestones : []
    milestones.forEach((m) => {
      if (!m) return
      try {
        events.push({
          id: m.id,
          date: m.completedAt || m.targetDate || caseData.createdAt,
          type: 'milestone',
          category: m.category,
          title: m.title,
          status: m.isCompleted ? 'completed' : 'upcoming',
          icon: <Flag className="size-3.5" />,
        })
      } catch { /* skip */ }
    })

    return events.sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } catch {
        return 0
      }
    })
    } catch {
      return []
    }
  }, [caseData])

  // Computed stats
  const stats = useMemo(() => {
    if (!caseData) return null

    try {
    const requirements = caseData.requirements || []
    const completedReqs = requirements.filter((r) => r.isCompleted).length
    const totalReqs = requirements.length

    const drugTests = Array.isArray(caseData.drugTests) ? caseData.drugTests : []
    const negativeTests = drugTests.filter((t) => t.result === 'negative').length
    const totalTests = drugTests.filter((t) => t.result).length

    const naSteps = caseData.naSteps || []
    const completedSteps = naSteps.filter((s) => s.isCompleted).length
    const totalSteps = naSteps.length || 12

    const counselingSessions = Array.isArray(caseData.counselingSessions) ? caseData.counselingSessions : []
    const completedSessions = counselingSessions.filter((s) => s.isCompleted).length
    const upcomingSessions = counselingSessions.filter(
      (s) => {
        if (s.isCompleted) return false
        try {
          const d = parseLocalDate(s.date)
          return isFuture(d)
        } catch {
          return false
        }
      }
    ).length

    const visits = Array.isArray(caseData.supervisedVisits) ? caseData.supervisedVisits : []
    const completedVisits = visits.filter((v) => v.isCompleted).length
    const visitTypes = [...new Set(visits.filter((v) => v.isCompleted).map((v) => v.visitType).filter(Boolean))]
    const visitProgression = visitTypes.join(' → ') || 'Starting visits'

    let daysInCase = 0
    let daysUntilTarget: number | null = null
    try {
      const removalDate = caseData.removalDate ? parseLocalDate(caseData.removalDate) : null
      const targetDate = caseData.targetReunificationDate ? parseLocalDate(caseData.targetReunificationDate) : null
      daysInCase = removalDate ? Math.max(0, differenceInDays(new Date(), removalDate)) : 0
      daysUntilTarget = targetDate ? Math.max(0, differenceInDays(targetDate, new Date())) : null
    } catch {
      // Use defaults
    }

    return {
      completedReqs,
      totalReqs,
      reqProgress: totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0,
      negativeTests,
      totalTests,
      drugTestPct: totalTests > 0 ? Math.round((negativeTests / totalTests) * 100) : 0,
      completedSteps,
      totalSteps,
      stepProgress: Math.round((completedSteps / totalSteps) * 100),
      completedSessions,
      upcomingSessions,
      completedVisits,
      visitProgression,
      daysInCase,
      daysUntilTarget,
    }
    } catch {
      return null
    }
  }, [caseData])

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    try {
      const now = startOfDay(new Date())
      const weekLater = addDays(now, 7)
      return allEvents
        .filter((e) => {
          try {
            const d = parseLocalDate(e.date)
            return isFuture(d) || isToday(d)
          } catch {
            return false
          }
        })
        .filter((e) => {
          try {
            return isWithinInterval(parseLocalDate(e.date), { start: now, end: weekLater })
          } catch {
            return false
          }
        })
        .slice(0, 10)
    } catch {
      return []
    }
  }, [allEvents])

  // Recent activity (last 7 days, completed)
  const recentActivity = useMemo(() => {
    try {
      const now = startOfDay(new Date())
      const weekAgo = addDays(now, -7)
      return allEvents
        .filter((e) => e.status === 'completed')
        .filter((e) => {
          try {
            const d = parseLocalDate(e.date)
            return isWithinInterval(d, { start: weekAgo, end: now }) || isToday(d)
          } catch {
            return false
          }
        })
        .sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime()
          } catch {
            return 0
          }
        })
        .slice(0, 10)
    } catch {
      return []
    }
  }, [allEvents])

  // --- RENDER ---
  if (isLoading) return <DashboardSkeleton />
  if (!caseData) return <EmptyDashboard />
  if (!stats) return <EmptyDashboard />

  const getCategoryStyle = (category: string) => {
    const c = CATEGORY_COLORS[category] || CATEGORY_COLORS['other']
    return c
  }

  // Map event type to the corresponding view for navigation
  const eventTypeToView = (type: string): ViewType => {
    switch (type) {
      case 'counseling': return 'counseling'
      case 'drug-testing': return 'drug-testing'
      case 'na-meetings': return 'na-meetings'
      case 'na-steps': return 'na-steps'
      case 'supervised-visits': return 'supervised-visits'
      case 'legal': return 'court-dates'
      case 'parenting-classes': return 'parenting-classes'
      case 'milestone': return 'case-plan'
      default: return 'timeline'
    }
  }

  const formatEventDate = (dateStr: string) => {
    try {
      const d = parseLocalDate(dateStr)
      if (isNaN(d.getTime())) return dateStr
      if (isToday(d)) return 'Today'
      if (isTomorrow(d)) return 'Tomorrow'
      return format(d, 'EEE, MMM d')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          {stats.daysInCase > 0
            ? `Day ${stats.daysInCase} of your journey — every step counts. Keep going!`
            : 'Your case overview at a glance'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Case Plan Progress"
          value={`${stats.completedReqs}/${stats.totalReqs}`}
          subtitle="Requirements completed"
          progress={stats.reqProgress}
          progressLabel={`${stats.reqProgress}% complete`}
          icon={<ClipboardList className="size-4 text-emerald-600" />}
          colorClass="bg-emerald-500"
          onClick={() => setActiveView('case-plan')}
        />
        <StatCard
          title="Clean Drug Tests"
          value={`${stats.negativeTests}/${stats.totalTests}`}
          subtitle={`${stats.drugTestPct}% clean rate`}
          progress={stats.drugTestPct}
          progressLabel="Keep it up!"
          icon={<TestTube2 className="size-4 text-amber-600" />}
          colorClass="bg-amber-500"
          onClick={() => setActiveView('drug-testing')}
        />
        <StatCard
          title="NA Steps Completed"
          value={`${stats.completedSteps}/${stats.totalSteps}`}
          subtitle="Steps in the program"
          progress={stats.stepProgress}
          progressLabel={`${stats.stepProgress}% through the steps`}
          icon={<Footprints className="size-4 text-purple-600" />}
          colorClass="bg-purple-500"
          onClick={() => setActiveView('na-steps')}
        />
        <StatCard
          title="Counseling Sessions"
          value={stats.completedSessions}
          subtitle={`${stats.upcomingSessions} upcoming`}
          icon={<Heart className="size-4 text-green-600" />}
          colorClass="bg-green-500"
          onClick={() => setActiveView('counseling')}
        />
        <StatCard
          title="Supervised Visits"
          value={stats.completedVisits}
          subtitle={stats.visitProgression}
          icon={<Eye className="size-4 text-sky-600" />}
          colorClass="bg-sky-500"
          onClick={() => setActiveView('supervised-visits')}
        />
        <StatCard
          title="Days in Case"
          value={stats.daysInCase}
          subtitle={
            stats.daysUntilTarget !== null
              ? `${stats.daysUntilTarget} days until target date`
              : 'No target date set'
          }
          icon={<CalendarDays className="size-4 text-slate-500" />}
          colorClass="bg-slate-400"
          onClick={() => setActiveView('timeline')}
        />
      </div>

      {/* Streaks & Achievements Section */}
      {caseData && (
        <AchievementsSection caseData={caseData} />
      )}

      {/* Daily Streak & Weekly Summary */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <StreakCard />
        <WeeklySummaryCard />
      </div>

      {/* Middle Section: Two Columns */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* Upcoming Deadlines & Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Clock className="size-3 sm:size-4 text-amber-600" />
              Upcoming Deadlines & Events
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Sparkles className="size-8 text-emerald-300 mb-2" />
                <p className="text-sm font-medium text-foreground">Nothing on the horizon!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No upcoming events in the next 7 days. Enjoy the calm or add new activities.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden pr-1" style={{ scrollbarGutter: 'stable' }}>
                {upcomingEvents.map((event) => {
                  const style = getCategoryStyle(event.category)
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 ${style.bg} ${style.border} transition-colors hover:opacity-80 cursor-pointer active:scale-[0.98]`}
                      onClick={() => setActiveView(eventTypeToView(event.type))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveView(eventTypeToView(event.type)) } }}
                    >
                      <div className="flex size-6 sm:size-8 items-center justify-center rounded-md bg-white/60 dark:bg-black/20 shrink-0">
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatEventDate(event.date)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs shrink-0 ${style.text} ${style.border}`}
                      >
                        {event.type.replace('-', ' ')}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Activity className="size-3 sm:size-4 text-emerald-600" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CircleCheckBig className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete activities to see your progress here. You&apos;re doing great!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden pr-1" style={{ scrollbarGutter: 'stable' }}>
                {recentActivity.map((event) => {
                  const style = getCategoryStyle(event.category)
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 bg-background hover:bg-accent/50 transition-colors cursor-pointer active:scale-[0.98]"
                      onClick={() => setActiveView(eventTypeToView(event.type))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveView(eventTypeToView(event.type)) } }}
                    >
                      <div className="flex size-6 sm:size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                        <CheckCircle2 className="size-3 sm:size-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatEventDate(event.date)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] sm:text-xs shrink-0 ${style.text} ${style.border}`}
                      >
                        {event.type.replace('-', ' ')}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary Card */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <FileText className="size-3 sm:size-4 text-emerald-600" />
              Case Summary
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={() => setActiveView('progress')}
            >
              <FileText className="size-3.5" />
              Full Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="space-y-3">
              {/* Basic Summary - always visible */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <button
                  className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2 sm:p-3 text-center hover:opacity-80 transition-opacity cursor-pointer active:scale-[0.97]"
                  onClick={() => setActiveView('case-plan')}
                >
                  <p className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-400">{stats.reqProgress}%</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400/70">Overall Progress</p>
                </button>
                <button
                  className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 sm:p-3 text-center hover:opacity-80 transition-opacity cursor-pointer active:scale-[0.97]"
                  onClick={() => setActiveView('case-plan')}
                >
                  <p className="text-lg sm:text-xl font-bold text-amber-700 dark:text-amber-400">{stats.completedReqs}/{stats.totalReqs}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400/70">Requirements</p>
                </button>
                <button
                  className="rounded-lg bg-sky-50 dark:bg-sky-950/20 p-2 sm:p-3 text-center hover:opacity-80 transition-opacity cursor-pointer active:scale-[0.97]"
                  onClick={() => setActiveView('drug-testing')}
                >
                  <p className="text-lg sm:text-xl font-bold text-sky-700 dark:text-sky-400">{stats.drugTestPct}%</p>
                  <p className="text-xs text-sky-600 dark:text-sky-400/70">Clean Tests</p>
                </button>
                <button
                  className="rounded-lg bg-violet-50 dark:bg-violet-950/20 p-2 sm:p-3 text-center hover:opacity-80 transition-opacity cursor-pointer active:scale-[0.97]"
                  onClick={() => setActiveView('na-steps')}
                >
                  <p className="text-lg sm:text-xl font-bold text-violet-700 dark:text-violet-400">{stats.completedSteps}/12</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400/70">NA Steps</p>
                </button>
              </div>

              {/* Free basic text summary */}
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Overview</p>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {`Case: ${caseData?.caseNumber || 'N/A'} — ${stats.reqProgress}% complete\n` +
                   `${stats.completedReqs} of ${stats.totalReqs} requirements done • ${stats.completedSessions} counseling sessions\n` +
                   `${stats.negativeTests} clean drug tests • ${stats.completedSteps}/12 NA steps • ${stats.completedVisits} visits completed`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add data to your case to see a summary
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Sparkles className="size-3 sm:size-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Log your progress quickly</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={() => setActiveView('drug-testing')}
            >
              <FlaskConical className="size-3 sm:size-4" />
              <span className="hidden sm:inline">Log Drug Test</span>
              <span className="sm:hidden">Drug Test</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={() => setActiveView('supervised-visits')}
            >
              <Eye className="size-3 sm:size-4" />
              <span className="hidden sm:inline">Record Visit</span>
              <span className="sm:hidden">Visit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950 h-8 sm:h-9 text-xs sm:text-sm"
              onClick={() => setActiveView('counseling')}
            >
              <MessageSquareHeart className="size-3 sm:size-4" />
              <span className="hidden sm:inline">Add Counseling Session</span>
              <span className="sm:hidden">Counseling</span>
            </Button>
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 sm:h-9 text-xs sm:text-sm" onClick={() => setActiveView('daily-checkins')}>
              <CircleCheckBig className="size-3 sm:size-4" />
              <span className="hidden sm:inline">Check In Today</span>
              <span className="sm:hidden">Check In</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardView
