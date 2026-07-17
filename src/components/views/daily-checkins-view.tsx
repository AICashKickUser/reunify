'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCase, useDailyCheckIns, useCreateItem, useUpdateItem } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'
import {
  CalendarCheck,
  Plus,
  Loader2,
  Smile,
  Meh,
  Frown,
  Sparkles,
  CheckCircle2,
  TestTube2,
  Users,
  StickyNote,
} from 'lucide-react'
import { format, isToday, parseISO } from 'date-fns'

const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', icon: Smile, color: 'text-emerald-600' },
  { value: 'good', label: 'Good', icon: Smile, color: 'text-green-500' },
  { value: 'okay', label: 'Okay', icon: Meh, color: 'text-amber-500' },
  { value: 'struggling', label: 'Struggling', icon: Frown, color: 'text-orange-500' },
  { value: 'bad', label: 'Bad', icon: Frown, color: 'text-red-500' },
]

function getMoodInfo(mood: string | null) {
  return MOOD_OPTIONS.find(m => m.value === mood) || MOOD_OPTIONS[2]
}

// --- Loading Skeleton ---
function CheckinsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// --- Empty State ---
function EmptyCheckins() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
        <CalendarCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">No Check-ins Yet</h3>
      <p className="text-muted-foreground text-sm text-center max-w-sm">
        Start your daily check-in to track how you&apos;re doing. A quick check-in each day helps you stay mindful of your progress.
      </p>
    </div>
  )
}

// --- Main Component ---
export function DailyCheckinsView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: caseData, isLoading: caseLoading } = useCase(activeCaseId)
  const { data: checkins, isLoading: checkinsLoading } = useDailyCheckIns(activeCaseId)
  const createCheckin = useCreateItem('daily-checkins')
  const updateCheckin = useUpdateItem('daily-checkins')

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedCheckin, setSelectedCheckin] = useState<typeof checkins extends (infer T)[] | null ? T : never | null>(null)

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [formMood, setFormMood] = useState('good')
  const [formDrugTestRequired, setFormDrugTestRequired] = useState(false)
  const [formDrugTestCompleted, setFormDrugTestCompleted] = useState(false)
  const [formMeetingsAttended, setFormMeetingsAttended] = useState(0)
  const [formNotes, setFormNotes] = useState('')

  const isLoading = caseLoading || checkinsLoading

  function resetForm() {
    setFormDate(format(new Date(), 'yyyy-MM-dd'))
    setFormMood('good')
    setFormDrugTestRequired(false)
    setFormDrugTestCompleted(false)
    setFormMeetingsAttended(0)
    setFormNotes('')
  }

  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    resetForm()
    setAddDialogOpen(true)
  }

  function openEditDialog(checkin: NonNullable<typeof checkins>[0]) {
    setSelectedCheckin(checkin)
    setFormDate(format(parseISO(checkin.date), 'yyyy-MM-dd'))
    setFormMood(checkin.mood || 'okay')
    setFormDrugTestRequired(checkin.drugTestRequired)
    setFormDrugTestCompleted(checkin.drugTestCompleted)
    setFormMeetingsAttended(checkin.meetingsAttended)
    setFormNotes(checkin.notes || '')
    setEditDialogOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCaseId) return

    await createCheckin.mutateAsync({
      caseId: activeCaseId,
      date: formDate,
      mood: formMood,
      drugTestRequired: formDrugTestRequired,
      drugTestCompleted: formDrugTestCompleted,
      meetingsAttended: formMeetingsAttended,
      notes: formNotes || null,
    })

    resetForm()
    setAddDialogOpen(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCheckin) return

    await updateCheckin.mutateAsync({
      id: selectedCheckin.id,
      mood: formMood,
      drugTestRequired: formDrugTestRequired,
      drugTestCompleted: formDrugTestCompleted,
      meetingsAttended: formMeetingsAttended,
      notes: formNotes || null,
    })

    resetForm()
    setEditDialogOpen(false)
    setSelectedCheckin(null)
  }

  if (isLoading) return <CheckinsSkeleton />
  if (!checkins || checkins.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Check-in</h1>
          <p className="text-muted-foreground text-sm mt-1">Take a moment each day to reflect on your journey</p>
        </div>
        <EmptyCheckins />
        <div className="flex justify-center">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="size-4" />
            Add First Check-in
          </Button>
        </div>
        <CheckinFormDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={handleCreate}
          isPending={createCheckin.isPending}
          formDate={formDate}
          setFormDate={setFormDate}
          formMood={formMood}
          setFormMood={setFormMood}
          formDrugTestRequired={formDrugTestRequired}
          setFormDrugTestRequired={setFormDrugTestRequired}
          formDrugTestCompleted={formDrugTestCompleted}
          setFormDrugTestCompleted={setFormDrugTestCompleted}
          formMeetingsAttended={formMeetingsAttended}
          setFormMeetingsAttended={setFormMeetingsAttended}
          formNotes={formNotes}
          setFormNotes={setFormNotes}
          title="Daily Check-in"
          description="How are you doing today?"
        />
      </div>
    )
  }

  // Compute stats
  const todayCheckin = checkins.find(c => isToday(parseISO(c.date)))
  const totalCheckins = checkins.length
  const thisWeekCheckins = checkins.filter(c => {
    const d = parseISO(c.date)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return d >= weekAgo && d <= now
  }).length
  const drugTestRate = checkins.filter(c => c.drugTestRequired).length > 0
    ? Math.round((checkins.filter(c => c.drugTestRequired && c.drugTestCompleted).length / checkins.filter(c => c.drugTestRequired).length) * 100)
    : 0
  const avgMood = checkins.length > 0
    ? (() => {
        const moodValues: Record<string, number> = { great: 5, good: 4, okay: 3, struggling: 2, bad: 1 }
        const sum = checkins.reduce((acc, c) => acc + (moodValues[c.mood || 'okay'] || 3), 0)
        return Math.round((sum / checkins.length) * 10) / 10
      })()
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Check-in</h1>
          <p className="text-muted-foreground text-sm mt-1">Take a moment each day to reflect on your journey</p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          onClick={() => {
            resetForm()
            setAddDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Check In Today
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Total Check-ins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckins}</div>
            <p className="text-xs text-muted-foreground">days tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">This Week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{thisWeekCheckins}</div>
            <p className="text-xs text-muted-foreground">check-ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Drug Test Compliance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{drugTestRate}%</div>
            <p className="text-xs text-muted-foreground">completed when required</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Avg Mood</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{avgMood}/5</div>
            <p className="text-xs text-muted-foreground">{avgMood >= 4 ? 'Doing great!' : avgMood >= 3 ? 'Hanging in there' : 'Stay strong'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Status */}
      {todayCheckin ? (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              Today&apos;s Check-in Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {(() => {
                  const moodInfo = getMoodInfo(todayCheckin.mood)
                  const MoodIcon = moodInfo.icon
                  return (
                    <>
                      <MoodIcon className={`size-5 ${moodInfo.color}`} />
                      <span className="text-sm font-medium capitalize">{todayCheckin.mood || 'Okay'}</span>
                    </>
                  )
                })()}
              </div>
              {todayCheckin.drugTestRequired && (
                <Badge variant="outline" className={todayCheckin.drugTestCompleted ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-700'}>
                  <TestTube2 className="size-3 mr-1" />
                  Drug test {todayCheckin.drugTestCompleted ? 'completed' : 'not completed'}
                </Badge>
              )}
              {todayCheckin.meetingsAttended > 0 && (
                <Badge variant="outline" className="border-violet-300 text-violet-700">
                  <Users className="size-3 mr-1" />
                  {todayCheckin.meetingsAttended} meeting{todayCheckin.meetingsAttended > 1 ? 's' : ''}
                </Badge>
              )}
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => openEditDialog(todayCheckin)}>
                Edit
              </Button>
            </div>
            {todayCheckin.notes && (
              <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                <StickyNote className="size-4 mt-0.5 shrink-0" />
                {todayCheckin.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="size-4 text-amber-600" />
              Haven&apos;t checked in today yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">Take a quick moment to log how you&apos;re doing today.</p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => {
                resetForm()
                setFormDate(format(new Date(), 'yyyy-MM-dd'))
                setAddDialogOpen(true)
              }}
            >
              <Plus className="size-4" />
              Check In Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Check-in History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check-in History</CardTitle>
          <CardDescription>Your recent daily check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1" style={{ scrollbarGutter: 'stable' }}>
            {checkins
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((checkin) => {
                const moodInfo = getMoodInfo(checkin.mood)
                const MoodIcon = moodInfo.icon
                return (
                  <div
                    key={checkin.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
                      <MoodIcon className={`size-4 ${moodInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{format(parseISO(checkin.date), 'MMM d, yyyy')}</p>
                        {isToday(parseISO(checkin.date)) && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Today</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium capitalize ${moodInfo.color}`}>
                          {checkin.mood || 'Okay'}
                        </span>
                        {checkin.drugTestRequired && (
                          <span className="text-xs text-muted-foreground">
                            • Drug test {checkin.drugTestCompleted ? '✓' : '✗'}
                          </span>
                        )}
                        {checkin.meetingsAttended > 0 && (
                          <span className="text-xs text-muted-foreground">
                            • {checkin.meetingsAttended} meeting{checkin.meetingsAttended > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {checkin.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{checkin.notes}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(checkin)}>
                      Edit
                    </Button>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <CheckinFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleCreate}
        isPending={createCheckin.isPending}
        formDate={formDate}
        setFormDate={setFormDate}
        formMood={formMood}
        setFormMood={setFormMood}
        formDrugTestRequired={formDrugTestRequired}
        setFormDrugTestRequired={setFormDrugTestRequired}
        formDrugTestCompleted={formDrugTestCompleted}
        setFormDrugTestCompleted={setFormDrugTestCompleted}
        formMeetingsAttended={formMeetingsAttended}
        setFormMeetingsAttended={setFormMeetingsAttended}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        title="Daily Check-in"
        description="How are you doing today?"
      />

      {/* Edit Dialog */}
      <CheckinFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdate}
        isPending={updateCheckin.isPending}
        formDate={formDate}
        setFormDate={setFormDate}
        formMood={formMood}
        setFormMood={setFormMood}
        formDrugTestRequired={formDrugTestRequired}
        setFormDrugTestRequired={setFormDrugTestRequired}
        formDrugTestCompleted={formDrugTestCompleted}
        setFormDrugTestCompleted={setFormDrugTestCompleted}
        formMeetingsAttended={formMeetingsAttended}
        setFormMeetingsAttended={setFormMeetingsAttended}
        formNotes={formNotes}
        setFormNotes={setFormNotes}
        title="Edit Check-in"
        description="Update your check-in details"
      />
    </div>
  )
}

// --- Form Dialog ---
function CheckinFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  formDate,
  setFormDate,
  formMood,
  setFormMood,
  formDrugTestRequired,
  setFormDrugTestRequired,
  formDrugTestCompleted,
  setFormDrugTestCompleted,
  formMeetingsAttended,
  setFormMeetingsAttended,
  formNotes,
  setFormNotes,
  title,
  description,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (e: React.FormEvent) => void
  isPending: boolean
  formDate: string
  setFormDate: (v: string) => void
  formMood: string
  setFormMood: (v: string) => void
  formDrugTestRequired: boolean
  setFormDrugTestRequired: (v: boolean) => void
  formDrugTestCompleted: boolean
  setFormDrugTestCompleted: (v: boolean) => void
  formMeetingsAttended: number
  setFormMeetingsAttended: (v: number) => void
  formNotes: string
  setFormNotes: (v: string) => void
  title: string
  description: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-emerald-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkin-date">Date</Label>
            <Input
              id="checkin-date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>How are you feeling?</Label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((mood) => {
                const Icon = mood.icon
                return (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setFormMood(mood.value)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      formMood === mood.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <Icon className={`size-5 ${mood.color}`} />
                    <span className="text-[10px] font-medium">{mood.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="drug-test-required"
                checked={formDrugTestRequired}
                onCheckedChange={(checked) => {
                  setFormDrugTestRequired(checked === true)
                  if (!checked) setFormDrugTestCompleted(false)
                }}
              />
              <Label htmlFor="drug-test-required" className="text-sm cursor-pointer">
                Drug test required today
              </Label>
            </div>
            {formDrugTestRequired && (
              <div className="flex items-center space-x-2 pl-6">
                <Checkbox
                  id="drug-test-completed"
                  checked={formDrugTestCompleted}
                  onCheckedChange={(checked) => setFormDrugTestCompleted(checked === true)}
                />
                <Label htmlFor="drug-test-completed" className="text-sm cursor-pointer">
                  Drug test completed
                </Label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetings-attended">Meetings Attended Today</Label>
            <Input
              id="meetings-attended"
              type="number"
              min="0"
              max="10"
              value={formMeetingsAttended}
              onChange={(e) => setFormMeetingsAttended(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkin-notes">Notes</Label>
            <Textarea
              id="checkin-notes"
              placeholder="How was your day? Any wins or challenges?"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Check-in'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
