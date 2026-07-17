'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useCase } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'
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
} from 'lucide-react'
import {
  format,
  differenceInDays,
  isToday,
  isTomorrow,
  isFuture,
  parseISO,
  isWithinInterval,
  addDays,
  startOfDay,
} from 'date-fns'

// --- Timeline Event Type ---
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
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
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
}: {
  title: string
  value: string | number
  subtitle: string
  progress?: number
  progressLabel?: string
  icon: React.ReactNode
  colorClass: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs font-medium uppercase tracking-wider">
            {title}
          </CardDescription>
          <div className={`flex size-8 items-center justify-center rounded-lg ${colorClass} bg-opacity-10`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-5 space-y-2">
        <div className="text-2xl font-bold">{value}</div>
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

// --- Main Dashboard ---
export function DashboardView() {
  const { activeCaseId, setActiveView } = useAppStore()
  const { data: caseData, isLoading } = useCase(activeCaseId)

  // Build unified timeline events
  const allEvents = useMemo<TimelineEvent[]>(() => {
    if (!caseData) return []

    const events: TimelineEvent[] = []

    // Counseling sessions
    caseData.counselingSessions?.forEach((s) => {
      events.push({
        id: s.id,
        date: s.date,
        type: 'counseling',
        category: 'counseling',
        title: `${s.sessionType || 'Counseling'} Session${s.counselorName ? ` with ${s.counselorName}` : ''}`,
        status: s.isCompleted ? 'completed' : isFuture(parseISO(s.date)) ? 'upcoming' : 'pending',
        icon: <Heart className="size-3.5" />,
      })
    })

    // Drug tests
    caseData.drugTests?.forEach((t) => {
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
    })

    // NA meetings
    caseData.naMeetings?.forEach((m) => {
      events.push({
        id: m.id,
        date: m.date,
        type: 'na-meetings',
        category: 'na-meetings',
        title: `NA Meeting${m.meetingName ? `: ${m.meetingName}` : ''}${m.isVerified ? ' ✓ Verified' : ''}`,
        status: m.isVerified ? 'completed' : 'upcoming',
        icon: <Users className="size-3.5" />,
      })
    })

    // Supervised visits
    caseData.supervisedVisits?.forEach((v) => {
      events.push({
        id: v.id,
        date: v.date,
        type: 'supervised-visits',
        category: 'supervised-visits',
        title: `${v.visitType || 'Supervised'} Visit${v.supervisorName ? ` with ${v.supervisorName}` : ''}`,
        status: v.isCompleted ? 'completed' : isFuture(parseISO(v.date)) ? 'upcoming' : 'pending',
        icon: <Eye className="size-3.5" />,
      })
    })

    // Court dates
    caseData.courtDates?.forEach((c) => {
      events.push({
        id: c.id,
        date: c.date,
        type: 'legal',
        category: 'legal',
        title: `${c.hearingType || 'Court'} Hearing${c.outcome ? ` — ${c.outcome}` : ''}`,
        status: c.isCompleted ? 'completed' : 'upcoming',
        icon: <Gavel className="size-3.5" />,
      })
    })

    // Parenting classes
    caseData.parentingClasses?.forEach((p) => {
      events.push({
        id: p.id,
        date: p.date,
        type: 'parenting-classes',
        category: 'parenting-classes',
        title: `Parenting Class${p.className ? `: ${p.className}` : ''}${p.hasCertificate ? ' 🏅' : ''}`,
        status: p.isCompleted ? 'completed' : isFuture(parseISO(p.date)) ? 'upcoming' : 'pending',
        icon: <BookOpen className="size-3.5" />,
      })
    })

    // Milestones
    caseData.milestones?.forEach((m) => {
      events.push({
        id: m.id,
        date: m.completedAt || m.targetDate || caseData.createdAt,
        type: 'milestone',
        category: m.category,
        title: m.title,
        status: m.isCompleted ? 'completed' : 'upcoming',
        icon: <Flag className="size-3.5" />,
      })
    })

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [caseData])

  // Computed stats
  const stats = useMemo(() => {
    if (!caseData) return null

    const requirements = caseData.requirements || []
    const completedReqs = requirements.filter((r) => r.isCompleted).length
    const totalReqs = requirements.length

    const drugTests = caseData.drugTests || []
    const negativeTests = drugTests.filter((t) => t.result === 'negative').length
    const totalTests = drugTests.filter((t) => t.result).length

    const naSteps = caseData.naSteps || []
    const completedSteps = naSteps.filter((s) => s.isCompleted).length
    const totalSteps = naSteps.length || 12

    const counselingSessions = caseData.counselingSessions || []
    const completedSessions = counselingSessions.filter((s) => s.isCompleted).length
    const upcomingSessions = counselingSessions.filter(
      (s) => !s.isCompleted && isFuture(parseISO(s.date))
    ).length

    const visits = caseData.supervisedVisits || []
    const completedVisits = visits.filter((v) => v.isCompleted).length
    const visitTypes = [...new Set(visits.filter((v) => v.isCompleted).map((v) => v.visitType).filter(Boolean))]
    const visitProgression = visitTypes.join(' → ') || 'Starting visits'

    
    const removalDate = caseData.removalDate ? parseISO(caseData.removalDate) : null
    const targetDate = caseData.targetReunificationDate ? parseISO(caseData.targetReunificationDate) : null
    const daysInCase = removalDate ? Math.max(0, differenceInDays(new Date(), removalDate)) : 0
    const daysUntilTarget = targetDate ? Math.max(0, differenceInDays(targetDate, new Date())) : null

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
  }, [caseData])

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date())
    const weekLater = addDays(now, 7)
    return allEvents
      .filter((e) => {
        const d = parseISO(e.date)
        return isFuture(d) || isToday(d)
      })
      .filter((e) => isWithinInterval(parseISO(e.date), { start: now, end: weekLater }))
      .slice(0, 10)
  }, [allEvents])

  // Recent activity (last 7 days, completed)
  const recentActivity = useMemo(() => {
    const now = startOfDay(new Date())
    const weekAgo = addDays(now, -7)
    return allEvents
      .filter((e) => e.status === 'completed')
      .filter((e) => {
        const d = parseISO(e.date)
        return isWithinInterval(d, { start: weekAgo, end: now }) || isToday(d)
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
  }, [allEvents])

  // --- RENDER ---
  if (isLoading) return <DashboardSkeleton />
  if (!caseData) return <EmptyDashboard />
  if (!stats) return <EmptyDashboard />

  const getCategoryStyle = (category: string) => {
    const c = CATEGORY_COLORS[category] || CATEGORY_COLORS['other']
    return c
  }

  const formatEventDate = (dateStr: string) => {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'EEE, MMM d')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {stats.daysInCase > 0
            ? `Day ${stats.daysInCase} of your journey — every step counts. Keep going!`
            : 'Your case overview at a glance'}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Case Plan Progress"
          value={`${stats.completedReqs}/${stats.totalReqs}`}
          subtitle="Requirements completed"
          progress={stats.reqProgress}
          progressLabel={`${stats.reqProgress}% complete`}
          icon={<ClipboardList className="size-4 text-emerald-600" />}
          colorClass="bg-emerald-500"
        />
        <StatCard
          title="Clean Drug Tests"
          value={`${stats.negativeTests}/${stats.totalTests}`}
          subtitle={`${stats.drugTestPct}% clean rate`}
          progress={stats.drugTestPct}
          progressLabel="Keep it up!"
          icon={<TestTube2 className="size-4 text-amber-600" />}
          colorClass="bg-amber-500"
        />
        <StatCard
          title="NA Steps Completed"
          value={`${stats.completedSteps}/${stats.totalSteps}`}
          subtitle="Steps in the program"
          progress={stats.stepProgress}
          progressLabel={`${stats.stepProgress}% through the steps`}
          icon={<Footprints className="size-4 text-purple-600" />}
          colorClass="bg-purple-500"
        />
        <StatCard
          title="Counseling Sessions"
          value={stats.completedSessions}
          subtitle={`${stats.upcomingSessions} upcoming`}
          icon={<Heart className="size-4 text-green-600" />}
          colorClass="bg-green-500"
        />
        <StatCard
          title="Supervised Visits"
          value={stats.completedVisits}
          subtitle={stats.visitProgression}
          icon={<Eye className="size-4 text-sky-600" />}
          colorClass="bg-sky-500"
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
        />
      </div>

      {/* Middle Section: Two Columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Deadlines & Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-amber-600" />
              Upcoming Deadlines & Events
            </CardTitle>
            <CardDescription>Next 7 days</CardDescription>
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
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                {upcomingEvents.map((event) => {
                  const style = getCategoryStyle(event.category)
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 ${style.bg} ${style.border} transition-colors hover:opacity-80`}
                    >
                      <div className="flex size-8 items-center justify-center rounded-md bg-white/60 dark:bg-black/20 shrink-0">
                        {event.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatEventDate(event.date)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${style.text} ${style.border}`}
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4 text-emerald-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Last 7 days</CardDescription>
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
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                {recentActivity.map((event) => {
                  const style = getCategoryStyle(event.category)
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 rounded-lg border p-3 bg-background hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{format(event.date, 'MMM d, yyyy')}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${style.text} ${style.border}`}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-emerald-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Log your progress quickly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
              onClick={() => setActiveView('drug-testing')}
            >
              <FlaskConical className="size-4" />
              Log Drug Test
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950"
              onClick={() => setActiveView('supervised-visits')}
            >
              <Eye className="size-4" />
              Record Visit
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
              onClick={() => setActiveView('counseling')}
            >
              <MessageSquareHeart className="size-4" />
              Add Counseling Session
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setActiveView('daily-checkins')}>
              <CircleCheckBig className="size-4" />
              Check In Today
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
