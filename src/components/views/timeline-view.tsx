'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { useCase } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'
import { CATEGORY_COLORS } from '@/lib/types'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Heart,
  FlaskConical,
  Users,
  Eye,
  Gavel,
  BookOpen,
  Flag,
  List,
  LayoutGrid,
  Plus,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react'
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isToday,
  isSameDay,
  parseISO,
  isFuture,
  startOfDay,
  isWithinInterval,
  addDays,
} from 'date-fns'

// --- Timeline Event Type ---
interface TimelineEvent {
  id: string
  date: string
  type: string
  category: string
  title: string
  description?: string
  status: 'completed' | 'upcoming' | 'pending' | 'missed'
  time?: string | null
}

// --- Category icon map ---
function getCategoryIcon(category: string) {
  switch (category) {
    case 'counseling':
      return <Heart className="size-3.5" />
    case 'drug-testing':
      return <FlaskConical className="size-3.5" />
    case 'na-meetings':
      return <Users className="size-3.5" />
    case 'supervised-visits':
      return <Eye className="size-3.5" />
    case 'legal':
      return <Gavel className="size-3.5" />
    case 'parenting-classes':
      return <BookOpen className="size-3.5" />
    default:
      return <Flag className="size-3.5" />
  }
}

// --- Category filter options ---
const CATEGORY_FILTERS = [
  { key: 'counseling', label: 'Counseling' },
  { key: 'drug-testing', label: 'Drug Tests' },
  { key: 'na-meetings', label: 'NA Meetings' },
  { key: 'supervised-visits', label: 'Visits' },
  { key: 'legal', label: 'Court' },
  { key: 'parenting-classes', label: 'Parenting' },
  { key: 'milestone', label: 'Milestones' },
] as const

// --- Loading skeleton ---
function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-2 grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// --- Empty state ---
function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-900/30 mb-4">
        <CalendarDays className="size-8 text-sky-600 dark:text-sky-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Events Yet</h3>
      <p className="text-muted-foreground text-sm text-center max-w-sm">
        Your timeline will populate as you add counseling sessions, drug tests, visits, and other case activities.
      </p>
    </div>
  )
}

// --- Status indicator ---
function StatusDot({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-3.5 text-emerald-600" />
    case 'upcoming':
      return <Clock className="size-3.5 text-amber-500" />
    case 'pending':
      return <AlertCircle className="size-3.5 text-orange-500" />
    default:
      return <Circle className="size-3.5 text-muted-foreground" />
  }
}

// --- Day Cell for week view ---
function DayCell({
  date,
  events,
  isSelected,
  onClick,
}: {
  date: Date
  events: TimelineEvent[]
  isSelected: boolean
  onClick: () => void
}) {
  const today = isToday(date)
  const hasEvents = events.length > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col rounded-xl border p-2 sm:p-3 text-left transition-all min-h-[120px] sm:min-h-[160px] ${
        today
          ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-200 dark:ring-emerald-800'
          : isSelected
            ? 'border-primary bg-accent/50'
            : 'border-border hover:border-primary/30 hover:bg-accent/30'
      } ${!hasEvents ? 'opacity-50' : ''}`}
    >
      <div className="mb-2">
        <p className={`text-xs font-medium uppercase tracking-wider ${today ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {format(date, 'EEE')}
        </p>
        <p className={`text-lg font-bold ${today ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
          {format(date, 'd')}
        </p>
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        {events.slice(0, 3).map((event) => {
          const style = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['other']
          return (
            <div
              key={event.id}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${style.bg} ${style.text} truncate`}
            >
              {getCategoryIcon(event.category)}
              <span className="truncate">{event.title.substring(0, 20)}</span>
            </div>
          )
        })}
        {events.length > 3 && (
          <p className="text-xs text-muted-foreground pl-1">+{events.length - 3} more</p>
        )}
      </div>
    </button>
  )
}

// --- Day Detail Panel ---
function DayDetail({
  date,
  events,
  onClose,
}: {
  date: Date
  events: TimelineEvent[]
  onClose: () => void
}) {
  const sortedEvents = [...events].sort((a, b) => {
    // Sort: completed first, then by type
    if (a.status === 'completed' && b.status !== 'completed') return -1
    if (a.status !== 'completed' && b.status === 'completed') return 1
    return a.title.localeCompare(b.title)
  })

  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {isToday(date) ? 'Today' : format(date, 'EEEE, MMMM d, yyyy')}
            </CardTitle>
            <CardDescription>
              {events.length} event{events.length !== 1 ? 's' : ''} scheduled
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarDays className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events on this day</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1.5">
              <Plus className="size-3.5" />
              Add Event
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((event) => {
              const style = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['other']
              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${style.bg} ${style.border}`}
                >
                  <div className="mt-0.5">
                    <StatusDot status={event.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${style.text} ${style.border}`}
                      >
                        {event.type.replace('-', ' ')}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    )}
                    {event.time && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="size-3" />
                        {event.time}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={event.status === 'completed' ? 'default' : 'secondary'}
                    className={`text-xs shrink-0 ${
                      event.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : event.status === 'upcoming'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : ''
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>
              )
            })}
            <Button variant="outline" size="sm" className="w-full gap-1.5 mt-2">
              <Plus className="size-3.5" />
              Add Event
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- Main Timeline View ---
export function TimelineView() {
  const { activeCaseId } = useAppStore()
  const { data: caseData, isLoading } = useCase(activeCaseId)

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week')
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(CATEGORY_FILTERS.map((f) => f.key))
  )

  // Build all timeline events
  const allEvents = useMemo<TimelineEvent[]>(() => {
    if (!caseData) return []

    const events: TimelineEvent[] = []

    caseData.counselingSessions?.forEach((s) => {
      events.push({
        id: s.id,
        date: s.date,
        type: 'counseling',
        category: 'counseling',
        title: `${s.sessionType || 'Counseling'} Session${s.counselorName ? ` — ${s.counselorName}` : ''}`,
        description: s.notes || undefined,
        status: s.isCompleted ? 'completed' : isFuture(parseISO(s.date)) ? 'upcoming' : 'pending',
      })
    })

    caseData.drugTests?.forEach((t) => {
      const resultLabel = t.result === 'negative' ? 'Negative' : t.result === 'positive' ? 'Positive' : t.result === 'diluted' ? 'Diluted' : 'Pending'
      events.push({
        id: t.id,
        date: t.date,
        type: 'drug-testing',
        category: 'drug-testing',
        title: `${t.testType || 'Drug'} Test — ${resultLabel}${t.isRandom ? ' (Random)' : ''}`,
        description: t.testingFacility || undefined,
        status: t.result ? 'completed' : 'upcoming',
      })
    })

    caseData.naMeetings?.forEach((m) => {
      events.push({
        id: m.id,
        date: m.date,
        type: 'na-meetings',
        category: 'na-meetings',
        title: `NA Meeting${m.meetingName ? `: ${m.meetingName}` : ''}`,
        description: m.location || undefined,
        status: m.isVerified ? 'completed' : 'upcoming',
      })
    })

    caseData.supervisedVisits?.forEach((v) => {
      events.push({
        id: v.id,
        date: v.date,
        type: 'supervised-visits',
        category: 'supervised-visits',
        title: `${v.visitType || 'Supervised'} Visit`,
        description: v.supervisorName ? `Supervisor: ${v.supervisorName}` : undefined,
        status: v.isCompleted ? 'completed' : isFuture(parseISO(v.date)) ? 'upcoming' : 'pending',
      })
    })

    caseData.courtDates?.forEach((c) => {
      events.push({
        id: c.id,
        date: c.date,
        type: 'legal',
        category: 'legal',
        title: `${c.hearingType || 'Court'} Hearing`,
        description: c.nextSteps || undefined,
        status: c.isCompleted ? 'completed' : 'upcoming',
      })
    })

    caseData.parentingClasses?.forEach((p) => {
      events.push({
        id: p.id,
        date: p.date,
        type: 'parenting-classes',
        category: 'parenting-classes',
        title: `Parenting Class${p.className ? `: ${p.className}` : ''}`,
        description: p.topic || undefined,
        status: p.isCompleted ? 'completed' : isFuture(parseISO(p.date)) ? 'upcoming' : 'pending',
      })
    })

    // Milestones as events
    caseData.milestones?.forEach((m) => {
      const dateToUse = m.completedAt || m.targetDate
      if (dateToUse) {
        events.push({
          id: m.id,
          date: dateToUse,
          type: 'milestone',
          category: m.category || 'milestone',
          title: `🏁 ${m.title}`,
          description: m.description || undefined,
          status: m.isCompleted ? 'completed' : 'upcoming',
        })
      }
    })

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [caseData])

  // Filter events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => activeFilters.has(e.type) || (e.type === 'milestone' && activeFilters.has('milestone')))
  }, [allEvents, activeFilters])

  // Week days
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd })
  }, [currentWeekStart])

  // Events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>()
    filteredEvents.forEach((event) => {
      const key = format(parseISO(event.date), 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(event)
    })
    return map
  }, [filteredEvents])

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDay.get(key) || []
  }, [selectedDate, eventsByDay])

  // List view events (chronological)
  const listEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredEvents])

  // Week navigation
  const goToPrevWeek = () => setCurrentWeekStart((w) => subWeeks(w, 1))
  const goToNextWeek = () => setCurrentWeekStart((w) => addWeeks(w, 1))
  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setSelectedDate(new Date())
  }

  // Toggle filter
  const toggleFilter = (key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Week label
  const weekLabel = `${format(currentWeekStart, 'MMM d')} – ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}`

  // --- RENDER ---
  if (isLoading) return <TimelineSkeleton />
  if (!caseData) return <EmptyTimeline />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View all your case events, appointments, and milestones
        </p>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground mr-1">
              Filter:
            </span>
            {CATEGORY_FILTERS.map((filter) => {
              const style = CATEGORY_COLORS[filter.key] || CATEGORY_COLORS['other']
              const isActive = activeFilters.has(filter.key)
              return (
                <label
                  key={filter.key}
                  className="flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <Checkbox
                    checked={isActive}
                    onCheckedChange={() => toggleFilter(filter.key)}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? style.text : 'text-muted-foreground line-through'
                    }`}
                  >
                    {filter.label}
                  </span>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek} aria-label="Previous week">
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Next week">
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="text-sm font-semibold ml-2 hidden sm:block">{weekLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            <CalendarDays className="size-3.5" />
            Today
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline ml-1.5">Week</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none"
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline ml-1.5">List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile week label */}
      <p className="text-sm font-semibold sm:hidden">{weekLabel}</p>

      {/* Week View */}
      {viewMode === 'week' ? (
        <div className="space-y-4">
          {/* Day Grid - 7 columns on desktop, list on mobile */}
          <div className="hidden md:grid md:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDay.get(key) || []
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false

              return (
                <DayCell
                  key={key}
                  date={day}
                  events={dayEvents}
                  isSelected={isSelected}
                  onClick={() => setSelectedDate(day)}
                />
              )
            })}
          </div>

          {/* Mobile: vertical day list */}
          <div className="md:hidden space-y-2">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const dayEvents = eventsByDay.get(key) || []
              const today = isToday(day)

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    today
                      ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-primary/30'
                  } ${dayEvents.length === 0 ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${today ? 'text-emerald-600' : ''}`}>
                      {format(day, 'EEEE, MMM d')}
                    </span>
                    {dayEvents.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {dayEvents.length}
                      </Badge>
                    )}
                  </div>
                  {dayEvents.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayEvents.map((event) => {
                        const style = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['other']
                        return (
                          <Badge
                            key={event.id}
                            variant="outline"
                            className={`text-xs ${style.text} ${style.border} ${style.bg}`}
                          >
                            {event.type.replace('-', ' ')}
                          </Badge>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No events</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Day Detail */}
          {selectedDate && (
            <DayDetail
              date={selectedDate}
              events={selectedDayEvents}
              onClose={() => setSelectedDate(null)}
            />
          )}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Events</CardTitle>
            <CardDescription>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listEvents.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No events match your filters</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
                {(() => {
                  let lastDateGroup = ''
                  return listEvents.map((event) => {
                    const dateGroup = format(parseISO(event.date), 'EEEE, MMMM d, yyyy')
                    const showDateHeader = dateGroup !== lastDateGroup
                    lastDateGroup = dateGroup

                    const style = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['other']
                    const dateObj = parseISO(event.date)
                    const today = isToday(dateObj)

                    return (
                      <div key={event.id}>
                        {showDateHeader && (
                          <div className={`text-xs font-semibold uppercase tracking-wider pt-3 pb-1 flex items-center gap-2 ${today ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {today && <span className="flex size-2 rounded-full bg-emerald-500" />}
                            {dateGroup}
                          </div>
                        )}
                        <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                          <div className="mt-0.5">
                            <StatusDot status={event.status} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium">{event.title}</p>
                              <Badge
                                variant="outline"
                                className={`text-xs ${style.text} ${style.border}`}
                              >
                                {event.type.replace('-', ' ')}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                            )}
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs shrink-0 ${
                              event.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : event.status === 'upcoming'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : ''
                            }`}
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
