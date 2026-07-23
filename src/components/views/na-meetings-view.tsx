'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useNAMeetings,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/lib/data-hooks'
import { CATEGORY_COLORS } from '@/lib/types'
import type { NAMeeting } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Calendar,
  CalendarDays,
  BadgeCheck,
  Plus,
  Pencil,
  Loader2,
  MapPin,
  Mic2,
  BookOpen,
  CheckCircle2,
  Target,
  Trophy,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Constants ───────────────────────────────────────────────────────
const WEEKLY_GOAL = 3

interface MeetingFormData {
  date: string
  meetingName: string
  location: string
  speaker: string
  topic: string
  isVerified: boolean
  notes: string
}

const emptyForm: MeetingFormData = {
  date: new Date().toISOString().split('T')[0],
  meetingName: '',
  location: '',
  speaker: '',
  topic: '',
  isVerified: false,
  notes: '',
}

// ─── Date helpers (Monday-based weeks) ───────────────────────────────

/** Get the Monday of the week containing the given date */
function getMondayOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  // Sunday is 0, Monday is 1... adjust to Monday start
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

/** Get the Sunday (end) of the week containing the given date */
function getSundayOfWeek(d: Date): Date {
  const monday = getMondayOfWeek(d)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday
}

/** Format a Monday date as "Week of Mon MMM D" */
function formatWeekLabel(monday: Date): string {
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

/** Check if a meeting date falls within a given Mon–Sun range */
function isDateInWeek(dateStr: string, weekMonday: Date, weekSunday: Date): boolean {
  const d = new Date(dateStr)
  return d >= weekMonday && d <= weekSunday
}

/** Count meetings in a specific week */
function countMeetingsInWeek(meetings: NAMeeting[], weekMonday: Date, weekSunday: Date): number {
  return meetings.filter((m) => isDateInWeek(m.date, weekMonday, weekSunday)).length
}

/** Get meetings that belong to a specific week */
function getMeetingsInWeek(meetings: NAMeeting[], weekMonday: Date, weekSunday: Date): NAMeeting[] {
  return meetings
    .filter((m) => isDateInWeek(m.date, weekMonday, weekSunday))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Generate past weeks (completed weeks only, not including current week) */
function getPastWeeks(meetings: NAMeeting[], count: number = 12): { monday: Date; sunday: Date }[] {
  const now = new Date()
  const currentMonday = getMondayOfWeek(now)
  const weeks: { monday: Date; sunday: Date }[] = []

  // Find the earliest meeting date to know how far back to go
  if (meetings.length > 0) {
    const earliestDate = new Date(meetings.reduce((min, m) => m.date < min ? m.date : min, meetings[0].date))
    const earliestMonday = getMondayOfWeek(earliestDate)

    // Start from the week before current, go back to earliest or count weeks
    let weekStart = new Date(currentMonday)
    weekStart.setDate(weekStart.getDate() - 7)

    while (weekStart >= earliestMonday && weeks.length < count) {
      const weekEnd = getSundayOfWeek(weekStart)
      weeks.push({ monday: new Date(weekStart), sunday: weekEnd })
      weekStart = new Date(weekStart)
      weekStart.setDate(weekStart.getDate() - 7)
    }
  } else {
    // No meetings yet — just show a few recent past weeks
    let weekStart = new Date(currentMonday)
    weekStart.setDate(weekStart.getDate() - 7)
    for (let i = 0; i < Math.min(count, 4); i++) {
      const weekEnd = getSundayOfWeek(weekStart)
      weeks.push({ monday: new Date(weekStart), sunday: weekEnd })
      weekStart = new Date(weekStart)
      weekStart.setDate(weekStart.getDate() - 7)
    }
  }

  return weeks
}

// ─── Week status helpers ─────────────────────────────────────────────

type WeekStatus = 'met' | 'partial' | 'missed'

function getWeekStatus(count: number): WeekStatus {
  if (count >= WEEKLY_GOAL) return 'met'
  if (count > 0) return 'partial'
  return 'missed'
}

function getStatusEmoji(status: WeekStatus): string {
  switch (status) {
    case 'met': return '✅'
    case 'partial': return '⚠️'
    case 'missed': return '❌'
  }
}

function getStatusLabel(status: WeekStatus): string {
  switch (status) {
    case 'met': return 'Goal Met'
    case 'partial': return 'Incomplete'
    case 'missed': return 'No Meetings'
  }
}

function getStatusColors(status: WeekStatus) {
  switch (status) {
    case 'met':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
      }
    case 'partial':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
        badgeText: 'text-amber-800 dark:text-amber-300',
      }
    case 'missed':
      return {
        bg: 'bg-red-50 dark:bg-red-950/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-300',
      }
  }
}

// ─── Main Component ──────────────────────────────────────────────────

export function NAMeetingsView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: meetings, isLoading } = useNAMeetings(activeCaseId)
  const createMutation = useCreateItem('na-meetings')
  const updateMutation = useUpdateItem('na-meetings')
  const deleteMutation = useDeleteItem('na-meetings')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<NAMeeting | null>(null)
  const [form, setForm] = useState<MeetingFormData>(emptyForm)
  const [quickAddExpanded, setQuickAddExpanded] = useState(false)
  const prevTriggerRef = useRef(addDialogTrigger)

  // Respond to global add dialog trigger
  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setAddOpen(true)
  }

  const colors = CATEGORY_COLORS['na-meetings']

  // ─── Weekly calculations ──────────────────────────────────────────
  const nowTimestamp = useMemo(() => Date.now(), [])
  const now = useMemo(() => new Date(nowTimestamp), [nowTimestamp])
  const currentMonday = useMemo(() => getMondayOfWeek(now), [now])
  const currentSunday = useMemo(() => getSundayOfWeek(now), [now])
  const safeMeetings = meetings ?? []

  const thisWeekMeetings = useMemo(
    () => getMeetingsInWeek(safeMeetings, currentMonday, currentSunday),
    [safeMeetings, currentMonday, currentSunday]
  )
  const thisWeekCount = thisWeekMeetings.length
  const weeklyGoalMet = thisWeekCount >= WEEKLY_GOAL
  const weeklyProgressPercent = Math.min((thisWeekCount / WEEKLY_GOAL) * 100, 100)

  // Past weeks for compliance history
  const pastWeeks = useMemo(() => getPastWeeks(safeMeetings, 12), [safeMeetings])

  // ─── Stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = safeMeetings.length
    const verified = safeMeetings.filter((m) => m.isVerified).length

    // Calculate weekly goal rate: how many completed weeks met the goal
    // A "completed week" is any past week (before current week)
    const completedWeeks = pastWeeks
    const weeksMetGoal = completedWeeks.filter(
      (w) => countMeetingsInWeek(safeMeetings, w.monday, w.sunday) >= WEEKLY_GOAL
    ).length
    const goalRate = completedWeeks.length > 0
      ? Math.round((weeksMetGoal / completedWeeks.length) * 100)
      : 0

    return { total, verified, goalRate }
  }, [safeMeetings, pastWeeks])

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleQuickAddToday = useCallback(() => {
    if (!activeCaseId) return
    createMutation.mutate(
      {
        caseId: activeCaseId,
        date: new Date().toISOString().split('T')[0],
        meetingName: null,
        location: null,
        speaker: null,
        topic: null,
        isVerified: false,
        notes: null,
      },
      {
        onSuccess: () => {
          toast.success('Meeting logged!', {
            description: 'You attended a meeting today. Add details anytime.',
          })
        },
      }
    )
  }, [activeCaseId, createMutation])

  const handleOpenAddDialog = useCallback(() => {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
    setAddOpen(true)
  }, [])

  const handleEdit = useCallback((meeting: NAMeeting) => {
    setEditingMeeting(meeting)
    setForm({
      date: meeting.date ? meeting.date.split('T')[0] : '',
      meetingName: meeting.meetingName || '',
      location: meeting.location || '',
      speaker: meeting.speaker || '',
      topic: meeting.topic || '',
      isVerified: meeting.isVerified,
      notes: meeting.notes || '',
    })
    setEditOpen(true)
  }, [])

  const handleDelete = useCallback((meeting: NAMeeting) => {
    deleteMutation.mutate(meeting.id, {
      onSuccess: () => {
        toast.success('Meeting removed')
        setEditOpen(false)
        setEditingMeeting(null)
      },
    })
  }, [deleteMutation])

  const submitAdd = useCallback(() => {
    if (!activeCaseId) return
    createMutation.mutate(
      {
        caseId: activeCaseId,
        date: form.date,
        meetingName: form.meetingName || null,
        location: form.location || null,
        speaker: form.speaker || null,
        topic: form.topic || null,
        isVerified: form.isVerified,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
          setForm(emptyForm)
          toast.success('Meeting logged!', {
            description: weeklyGoalMet
              ? 'Your weekly goal is already met — great work!'
              : `${thisWeekCount + 1}/${WEEKLY_GOAL} meetings this week`,
          })
        },
      }
    )
  }, [activeCaseId, form, createMutation, weeklyGoalMet, thisWeekCount])

  const submitEdit = useCallback(() => {
    if (!editingMeeting) return
    updateMutation.mutate(
      {
        id: editingMeeting.id,
        date: form.date,
        meetingName: form.meetingName || null,
        location: form.location || null,
        speaker: form.speaker || null,
        topic: form.topic || null,
        isVerified: form.isVerified,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditingMeeting(null)
          toast.success('Meeting updated')
        },
      }
    )
  }, [editingMeeting, form, updateMutation])

  // ─── Loading skeleton ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-6 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex size-9 items-center justify-center rounded-lg ${colors.bg}`}>
            <Users className={`size-5 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">NA Meetings</h2>
            <p className="text-sm text-muted-foreground">
              {WEEKLY_GOAL} meetings per week — track your progress
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAddDialog} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="size-4" />
          Add Meeting
        </Button>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* This Week */}
        <Card className={`${weeklyGoalMet ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg ${weeklyGoalMet ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-violet-50 dark:bg-violet-900/20'}`}>
                <Calendar className={`size-5 ${weeklyGoalMet ? 'text-emerald-600' : 'text-violet-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className={`text-2xl font-bold ${weeklyGoalMet ? 'text-emerald-600' : 'text-violet-600'}`}>
                  {thisWeekCount}/{WEEKLY_GOAL}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <Target className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goal Rate</p>
                <p className="text-2xl font-bold text-violet-600">{stats.goalRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Meetings */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <Users className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verified */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <BadgeCheck className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── This Week's Meeting Tracker (PRIMARY) ─────────────── */}
      <Card className={`border-2 ${weeklyGoalMet ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-violet-200 dark:border-violet-800 bg-violet-50/30 dark:bg-violet-950/10'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className={`size-5 ${weeklyGoalMet ? 'text-emerald-600' : 'text-violet-600'}`} />
              This Week&apos;s Tracker
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {formatWeekLabel(currentMonday)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xl font-bold ${weeklyGoalMet ? 'text-emerald-600' : 'text-violet-600'}`}>
                {thisWeekCount}/{WEEKLY_GOAL} meetings this week
              </span>
              {weeklyGoalMet ? (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-sm px-3 py-1">
                  <Trophy className="size-4 mr-1" />
                  Weekly Goal Met! ✅
                </Badge>
              ) : thisWeekCount > 0 ? (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-sm px-3 py-1">
                  {WEEKLY_GOAL - thisWeekCount} more needed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Start logging meetings
                </Badge>
              )}
            </div>
            <Progress
              value={weeklyProgressPercent}
              className={`h-3 ${weeklyGoalMet ? '[&>[data-slot=progress-indicator]]:bg-emerald-500' : '[&>[data-slot=progress-indicator]]:bg-violet-500'}`}
            />
          </div>

          {/* Celebration message when goal met */}
          {weeklyGoalMet && (
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-4 text-center">
              <Trophy className="size-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-emerald-800 dark:text-emerald-300 font-semibold text-lg">
                You hit your weekly goal! 🎉
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 text-sm mt-1">
                The court sees your commitment. Keep going — every week counts.
              </p>
            </div>
          )}

          {/* Meeting slots */}
          <div className="space-y-3">
            {Array.from({ length: WEEKLY_GOAL }).map((_, slotIndex) => {
              const meeting = thisWeekMeetings[slotIndex]
              const isFilled = slotIndex < thisWeekCount
              const isNextSlot = slotIndex === thisWeekCount && !weeklyGoalMet

              return (
                <div
                  key={slotIndex}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    isFilled
                      ? 'border-violet-200 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20'
                      : isNextSlot
                      ? 'border-dashed border-violet-300 dark:border-violet-600 bg-violet-50/20 dark:bg-violet-950/10'
                      : 'border-dashed border-muted-foreground/20 bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Slot number indicator */}
                    <div className={`flex size-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                      isFilled
                        ? 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200'
                        : isNextSlot
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isFilled ? (
                        <CheckCircle2 className="size-5 text-violet-700 dark:text-violet-300" />
                      ) : (
                        slotIndex + 1
                      )}
                    </div>

                    {/* Meeting details or placeholder */}
                    {isFilled && meeting ? (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {new Date(meeting.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {meeting.isVerified && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                              <BadgeCheck className="size-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {meeting.meetingName && (
                            <Badge variant="outline" className="text-xs">
                              {meeting.meetingName}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                          {meeting.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3 shrink-0" />
                              {meeting.location}
                            </span>
                          )}
                          {meeting.topic && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="size-3 shrink-0" />
                              {meeting.topic}
                            </span>
                          )}
                          {meeting.speaker && (
                            <span className="flex items-center gap-1">
                              <Mic2 className="size-3 shrink-0" />
                              {meeting.speaker}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 text-xs text-violet-600 hover:text-violet-700"
                          onClick={() => handleEdit(meeting)}
                        >
                          <Pencil className="size-3 mr-1" />
                          Edit details
                        </Button>
                      </div>
                    ) : isNextSlot ? (
                      <div className="flex-1">
                        <p className="text-sm font-medium text-violet-700 dark:text-violet-400">
                          Meeting {slotIndex + 1} — Log your next meeting
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tap below to quickly mark attendance or add details
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          Meeting {slotIndex + 1} — Not yet logged
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick-add actions */}
          {!weeklyGoalMet && (
            <div className="space-y-3">
              {/* One-tap quick add */}
              <Button
                onClick={handleQuickAddToday}
                disabled={createMutation.isPending}
                className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white text-base"
              >
                {createMutation.isPending ? (
                  <Loader2 className="size-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="size-5 mr-2" />
                )}
                I Attended a Meeting Today
              </Button>

              {/* Expandable detailed add */}
              {!quickAddExpanded ? (
                <Button
                  variant="outline"
                  className="w-full border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-400"
                  onClick={() => setQuickAddExpanded(true)}
                >
                  <Plus className="size-4 mr-1" />
                  Add with Details (name, location, topic)
                </Button>
              ) : (
                <Card className="border-violet-200 dark:border-violet-700">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meeting Name</Label>
                        <Input
                          value={form.meetingName}
                          onChange={(e) => setForm((f) => ({ ...f, meetingName: e.target.value }))}
                          placeholder="e.g., Hope & Recovery"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Location</Label>
                        <Input
                          value={form.location}
                          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                          placeholder="e.g., Community Center"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Topic</Label>
                        <Input
                          value={form.topic}
                          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                          placeholder="Meeting topic"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={form.isVerified}
                        onCheckedChange={(checked) =>
                          setForm((f) => ({ ...f, isVerified: checked === true }))
                        }
                      />
                      <Label className="text-xs cursor-pointer">Attendance verified (court-verifiable)</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={submitAdd}
                        disabled={createMutation.isPending}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                        size="sm"
                      >
                        {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                        Save Meeting
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setQuickAddExpanded(false)
                          setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* When goal is met, still allow adding more */}
          {weeklyGoalMet && (
            <div className="text-center">
              <Button
                variant="outline"
                className="border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                onClick={handleOpenAddDialog}
              >
                <Plus className="size-4 mr-1" />
                Log Additional Meeting
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Weekly Compliance History ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="size-5 text-violet-600" />
              Weekly Compliance History
            </CardTitle>
            {pastWeeks.length > 0 && (
              <Badge className={`${weeklyGoalMet ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300'}`}>
                {stats.goalRate}% goal rate
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            This is what the court looks at — your weekly meeting compliance record.
          </p>
        </CardHeader>
        <CardContent>
          {pastWeeks.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarDays className="size-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No past weeks to show yet. Start logging meetings to build your compliance history.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {pastWeeks.map((week) => {
                const weekMeetings = countMeetingsInWeek(safeMeetings, week.monday, week.sunday)
                const status = getWeekStatus(weekMeetings)
                const statusColors = getStatusColors(status)
                const weekMeetingList = getMeetingsInWeek(safeMeetings, week.monday, week.sunday)

                return (
                  <div
                    key={week.monday.toISOString()}
                    className={`rounded-lg border p-3 transition-colors ${statusColors.border} ${statusColors.bg}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium shrink-0">
                          {formatWeekLabel(week.monday)}
                        </span>
                        <Badge className={`${statusColors.badgeBg} ${statusColors.badgeText} text-xs shrink-0`}>
                          {getStatusEmoji(status)} {getStatusLabel(status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${statusColors.text}`}>
                          {weekMeetings}/{WEEKLY_GOAL}
                        </span>
                        {/* Mini progress bar */}
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              status === 'met' ? 'bg-emerald-500' :
                              status === 'partial' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((weekMeetings / WEEKLY_GOAL) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {/* Show meeting details for this week if any */}
                    {weekMeetingList.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {weekMeetingList.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <span className="font-medium">
                              {new Date(m.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                            </span>
                            {m.meetingName && <span>{m.meetingName}</span>}
                            {m.isVerified && (
                              <BadgeCheck className="size-3 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Empty state (when no meetings at all) ───────────────── */}
      {safeMeetings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">Start Your Recovery Journey</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Every meeting counts. Your case plan requires {WEEKLY_GOAL} NA meetings per week.
              Log your first meeting to start building your attendance record for the court.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Full Add Meeting Dialog ─────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5 text-violet-600" />
              Log NA Meeting
            </DialogTitle>
            <DialogDescription>
              Record your meeting attendance. Every meeting strengthens your case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-date">Date *</Label>
                <Input
                  id="add-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-name">Meeting Name</Label>
                <Input
                  id="add-name"
                  value={form.meetingName}
                  onChange={(e) => setForm((f) => ({ ...f, meetingName: e.target.value }))}
                  placeholder="e.g., Hope & Recovery Group"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-location">Location</Label>
                <Input
                  id="add-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Community Center, 123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-speaker">Speaker</Label>
                <Input
                  id="add-speaker"
                  value={form.speaker}
                  onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                  placeholder="Speaker name (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-topic">Topic</Label>
              <Input
                id="add-topic"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="Meeting topic or theme"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="add-verified"
                checked={form.isVerified}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isVerified: checked === true }))
                }
              />
              <Label htmlFor="add-verified" className="cursor-pointer">
                Attendance verified (court-verifiable)
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Meeting notes, reflections..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAdd}
              disabled={createMutation.isPending || !form.date}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Log Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Meeting Dialog ─────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-violet-600" />
              Edit NA Meeting
            </DialogTitle>
            <DialogDescription>
              Update meeting details or mark as verified for court records.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Meeting Name</Label>
                <Input
                  id="edit-name"
                  value={form.meetingName}
                  onChange={(e) => setForm((f) => ({ ...f, meetingName: e.target.value }))}
                  placeholder="e.g., Hope & Recovery Group"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Community Center, 123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-speaker">Speaker</Label>
                <Input
                  id="edit-speaker"
                  value={form.speaker}
                  onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                  placeholder="Speaker name (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-topic">Topic</Label>
              <Input
                id="edit-topic"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                placeholder="Meeting topic or theme"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-verified"
                checked={form.isVerified}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isVerified: checked === true }))
                }
              />
              <Label htmlFor="edit-verified" className="cursor-pointer">
                Attendance verified (court-verifiable)
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Meeting notes, reflections..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => editingMeeting && handleDelete(editingMeeting)}
              disabled={deleteMutation.isPending}
              className="mr-auto"
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateMutation.isPending || !form.date}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
