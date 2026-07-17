'use client'

import { useState } from 'react'
import { format, parseISO, isPast, isFuture, differenceInDays } from 'date-fns'
import {
  Scale, Plus, Edit, CalendarDays, Clock, CheckCircle2,
  AlertCircle, Gavel, FileText, ArrowRight, Loader2, MapPin,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useCourtDates, useCase, useCreateItem, useUpdateItem } from '@/lib/data-hooks'
import type { CourtDate } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

const HEARING_TYPES = [
  { value: 'emergency', label: 'Emergency', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'adjudication', label: 'Adjudication', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'disposition', label: 'Disposition', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'review', label: 'Review', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { value: 'permanency', label: 'Permanency', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'termination', label: 'Termination', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'final', label: 'Final', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
] as const

function getHearingTypeConfig(type: string | null) {
  return HEARING_TYPES.find(h => h.value === type) ?? { value: type, label: type ?? 'Other', color: 'bg-gray-100 text-gray-700 border-gray-200' }
}

function DatePickerField({ value, onChange, label }: {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  label: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarDays className="mr-2 size-4" />
            {value ? format(value, 'MMM d, yyyy') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => { onChange(d); setOpen(false) }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function AddCourtDateDialog({ open, onOpenChange, caseId }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
}) {
  const [date, setDate] = useState<Date | undefined>()
  const [hearingType, setHearingType] = useState('')
  const [notes, setNotes] = useState('')
  const createMutation = useCreateItem('court-dates')

  const resetForm = () => {
    setDate(undefined)
    setHearingType('')
    setNotes('')
  }

  const handleSubmit = () => {
    if (!date) return
    createMutation.mutate({
      caseId,
      date: date.toISOString(),
      hearingType: hearingType || null,
      notes: notes || null,
      isCompleted: false,
    }, {
      onSuccess: () => {
        onOpenChange(false)
        resetForm()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Court Date</DialogTitle>
          <DialogDescription>Schedule a new court hearing</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <DatePickerField value={date} onChange={setDate} label="Hearing Date *" />
          <div className="space-y-2">
            <Label>Hearing Type</Label>
            <Select value={hearingType} onValueChange={setHearingType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select hearing type" />
              </SelectTrigger>
              <SelectContent>
                {HEARING_TYPES.map(h => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes about this hearing..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm() }}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!date || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add Court Date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditCourtDateDialog({ open, onOpenChange, courtDate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  courtDate: CourtDate | null
}) {
  const [date, setDate] = useState<Date | undefined>()
  const [hearingType, setHearingType] = useState('')
  const [notes, setNotes] = useState('')
  const [outcome, setOutcome] = useState('')
  const [judgeNotes, setJudgeNotes] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const updateMutation = useUpdateItem('court-dates')

  // Sync form when courtDate changes
  if (courtDate && open) {
    const parsedDate = courtDate.date ? parseISO(courtDate.date) : undefined
    if (date === undefined && courtDate.date) {
      setDate(parsedDate)
      setHearingType(courtDate.hearingType ?? '')
      setNotes(courtDate.notes ?? '')
      setOutcome(courtDate.outcome ?? '')
      setJudgeNotes(courtDate.judgeNotes ?? '')
      setNextSteps(courtDate.nextSteps ?? '')
      setIsCompleted(courtDate.isCompleted)
    }
  }

  const resetAndClose = () => {
    setDate(undefined)
    setHearingType('')
    setNotes('')
    setOutcome('')
    setJudgeNotes('')
    setNextSteps('')
    setIsCompleted(false)
    onOpenChange(false)
  }

  const handleSubmit = () => {
    if (!courtDate) return
    updateMutation.mutate({
      id: courtDate.id,
      date: date ? date.toISOString() : courtDate.date,
      hearingType: hearingType || null,
      notes: notes || null,
      outcome: outcome || null,
      judgeNotes: judgeNotes || null,
      nextSteps: nextSteps || null,
      isCompleted,
    }, {
      onSuccess: () => {
        resetAndClose()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Court Date</DialogTitle>
          <DialogDescription>Update hearing details and outcomes</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <DatePickerField value={date} onChange={setDate} label="Hearing Date" />
          <div className="space-y-2">
            <Label>Hearing Type</Label>
            <Select value={hearingType} onValueChange={setHearingType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select hearing type" />
              </SelectTrigger>
              <SelectContent>
                {HEARING_TYPES.map(h => (
                  <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes about this hearing..." rows={2} />
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hearing-completed"
              checked={isCompleted}
              onChange={e => setIsCompleted(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="hearing-completed" className="cursor-pointer">Hearing completed</Label>
          </div>

          {isCompleted && (
            <>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Textarea value={outcome} onChange={e => setOutcome(e.target.value)} placeholder="What was the outcome?" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Judge Notes</Label>
                <Textarea value={judgeNotes} onChange={e => setJudgeNotes(e.target.value)} placeholder="Notes from the judge..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Next Steps</Label>
                <Textarea value={nextSteps} onChange={e => setNextSteps(e.target.value)} placeholder="What needs to happen next..." rows={2} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SummaryCard({ courtDates }: { courtDates: CourtDate[] }) {
  const now = new Date()

  const upcomingDates = courtDates
    .filter(cd => !cd.isCompleted && isFuture(parseISO(cd.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pastDates = courtDates
    .filter(cd => cd.isCompleted || isPast(parseISO(cd.date)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const nextCourtDate = upcomingDates[0]
  const lastHearing = pastDates[0]

  const daysUntilNext = nextCourtDate
    ? differenceInDays(parseISO(nextCourtDate.date), now)
    : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="size-5 text-slate-600" />
          Court Dates Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Hearings</p>
            <p className="text-2xl font-bold">{courtDates.length}</p>
            <p className="text-xs text-muted-foreground">
              {courtDates.filter(cd => cd.isCompleted).length} completed
            </p>
          </div>

          {nextCourtDate ? (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Court Date</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">
                  {format(parseISO(nextCourtDate.date), 'MMM d, yyyy')}
                </p>
                {daysUntilNext !== null && (
                  <Badge variant={daysUntilNext < 7 ? 'destructive' : 'outline'} className="text-xs">
                    {daysUntilNext === 0 ? 'Today' : daysUntilNext === 1 ? 'Tomorrow' : `${daysUntilNext} days away`}
                  </Badge>
                )}
              </div>
              {nextCourtDate.hearingType && (
                <Badge className={`${getHearingTypeConfig(nextCourtDate.hearingType).color} border text-xs`}>
                  {getHearingTypeConfig(nextCourtDate.hearingType).label}
                </Badge>
              )}
            </div>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Next Court Date</p>
              <p className="text-sm text-muted-foreground">No upcoming hearings scheduled</p>
            </div>
          )}
        </div>

        {lastHearing && lastHearing.outcome && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Hearing Outcome</p>
              <p className="text-sm">{lastHearing.outcome}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(lastHearing.date), 'MMM d, yyyy')}
                {lastHearing.hearingType && ` — ${getHearingTypeConfig(lastHearing.hearingType).label}`}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function CourtDateCard({
  courtDate,
  onEdit,
  isLast,
}: {
  courtDate: CourtDate
  onEdit: () => void
  isLast: boolean
}) {
  const hearingConfig = getHearingTypeConfig(courtDate.hearingType)
  const date = parseISO(courtDate.date)
  const isUpcoming = isFuture(date) && !courtDate.isCompleted
  const isEmergency = courtDate.hearingType === 'emergency'

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`size-3 rounded-full mt-1.5 ${
          courtDate.isCompleted
            ? 'bg-emerald-500'
            : isUpcoming
              ? 'bg-amber-500 ring-4 ring-amber-100'
              : 'bg-muted-foreground/30'
        }`} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Card content */}
      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
        <Card className={`${isEmergency && !courtDate.isCompleted ? 'border-red-200 bg-red-50/30' : ''} ${isUpcoming ? 'border-amber-200' : ''}`}>
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-semibold">
                    {format(date, 'MMMM d, yyyy')}
                  </p>
                  {isUpcoming && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                      <Clock className="size-2.5 mr-0.5" />
                      Upcoming
                    </Badge>
                  )}
                  {courtDate.isCompleted && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50">
                      <CheckCircle2 className="size-2.5 mr-0.5" />
                      Completed
                    </Badge>
                  )}
                </div>
                {courtDate.hearingType && (
                  <Badge className={`${hearingConfig.color} border text-xs`}>
                    {hearingConfig.label}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onEdit}>
                <Edit className="size-3.5" />
              </Button>
            </div>

            {/* Outcome */}
            {courtDate.outcome && (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-2.5">
                <p className="text-xs font-medium text-emerald-700 mb-0.5">Outcome</p>
                <p className="text-sm text-emerald-900">{courtDate.outcome}</p>
              </div>
            )}

            {/* Judge Notes */}
            {courtDate.judgeNotes && (
              <div className="flex items-start gap-2">
                <Gavel className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Judge Notes</p>
                  <p className="text-sm">{courtDate.judgeNotes}</p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {courtDate.nextSteps && (
              <div className="flex items-start gap-2">
                <ArrowRight className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Next Steps</p>
                  <p className="text-sm">{courtDate.nextSteps}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {courtDate.notes && !courtDate.outcome && (
              <div className="flex items-start gap-2">
                <FileText className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{courtDate.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CourtDateTimeline({ courtDates }: { courtDates: CourtDate[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editDate, setEditDate] = useState<CourtDate | null>(null)
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const [prevTrigger, setPrevTrigger] = useState(addDialogTrigger)

  if (addDialogTrigger !== prevTrigger && addDialogTrigger > 0) {
    setPrevTrigger(addDialogTrigger)
    setAddOpen(true)
  }

  const sortedDates = [...courtDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="size-5 text-slate-600" />
            Hearing Timeline
          </CardTitle>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            size="sm"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-3.5 mr-1" />
            Add Court Date
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedDates.length === 0 ? (
          <div className="text-center py-8">
            <Scale className="size-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No court dates scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first court hearing</p>
            <Button
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-3.5 mr-1" />
              Add Court Date
            </Button>
          </div>
        ) : (
          <div className="space-y-0">
            {sortedDates.map((cd, i) => (
              <CourtDateCard
                key={cd.id}
                courtDate={cd}
                onEdit={() => setEditDate(cd)}
                isLast={i === sortedDates.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>

      {activeCaseId && (
        <AddCourtDateDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          caseId={activeCaseId}
        />
      )}
      <EditCourtDateDialog
        open={!!editDate}
        onOpenChange={(open) => { if (!open) setEditDate(null) }}
        courtDate={editDate}
      />
    </Card>
  )
}

export function CourtDatesView() {
  const { activeCaseId } = useAppStore()
  const { data: courtDates, isLoading } = useCourtDates(activeCaseId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!courtDates || courtDates.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Scale className="size-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No court dates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule your first court hearing to begin tracking</p>
          </CardContent>
        </Card>
        <CourtDateTimeline courtDates={[]} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryCard courtDates={courtDates} />
      <CourtDateTimeline courtDates={courtDates} />
    </div>
  )
}
