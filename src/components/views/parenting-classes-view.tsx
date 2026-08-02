'use client'

import { useState, useRef } from 'react'
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
  GraduationCap,
  Check,
  Award,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Calendar,
  CheckCircle2,
  Target,
  Loader2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  useParentingClasses,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/lib/data-hooks'
import type { ParentingClass } from '@/lib/types'
import { toast } from 'sonner'
import { getLocalDateString } from '@/lib/utils'
import { DateInputField } from '@/components/date-input-field'

// How many weekly classes are required in the case plan
const TOTAL_WEEKLY_CLASSES = 16

// Generate Tuesday dates for 16 weeks starting from a given date
function generateTuesdayDates(startDate: Date): Date[] {
  const dates: Date[] = []
  // Find the first Tuesday from the start date
  const firstTuesday = new Date(startDate)
  const dayOfWeek = firstTuesday.getDay()
  const daysUntilTuesday = dayOfWeek <= 2 ? 2 - dayOfWeek : 9 - dayOfWeek
  firstTuesday.setDate(firstTuesday.getDate() + daysUntilTuesday)

  for (let i = 0; i < TOTAL_WEEKLY_CLASSES; i++) {
    const date = new Date(firstTuesday)
    date.setDate(firstTuesday.getDate() + i * 7)
    dates.push(date)
  }
  return dates
}

function formatDateShort(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function EditClassDialog({
  parentingClass,
  open,
  onOpenChange,
}: {
  parentingClass: ParentingClass
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateMutation = useUpdateItem('parenting-classes')
  const deleteMutation = useDeleteItem('parenting-classes')
  const [form, setForm] = useState({
    date: parentingClass.date ? parentingClass.date.slice(0, 10) : '',
    className: parentingClass.className || '',
    provider: parentingClass.provider || '',
    topic: parentingClass.topic || '',
    isCompleted: parentingClass.isCompleted,
    hasCertificate: parentingClass.hasCertificate,
    notes: parentingClass.notes || '',
  })

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        id: parentingClass.id,
        date: form.date || parentingClass.date,
        className: form.className || null,
        provider: form.provider || null,
        topic: form.topic || null,
        isCompleted: form.isCompleted,
        hasCertificate: form.hasCertificate,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          toast.success('Class updated')
          onOpenChange(false)
        },
        onError: () => toast.error('Failed to update class'),
      }
    )
  }

  const handleDelete = () => {
    deleteMutation.mutate(parentingClass.id, {
      onSuccess: () => {
        toast.success('Class deleted')
        onOpenChange(false)
      },
      onError: () => toast.error('Failed to delete class'),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-rose-600" />
            Edit Parenting Class
          </DialogTitle>
          <DialogDescription>Update class details and completion status</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <DateInputField
              id="edit-class-date"
              label="Class Date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              helperText="When did you attend this class? Past dates OK."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-name">Class Name</Label>
            <Input id="edit-class-name" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="e.g., Positive Parenting Workshop" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-provider">Provider</Label>
            <Input id="edit-class-provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="e.g., Family Services Center" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-topic">Topic</Label>
            <Input id="edit-class-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g., Child Development & Discipline" />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox id="edit-class-completed" checked={form.isCompleted} onCheckedChange={(checked) => setForm({ ...form, isCompleted: !!checked })} />
              <Label htmlFor="edit-class-completed" className="cursor-pointer font-medium">Completed</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="edit-class-certificate" checked={form.hasCertificate} onCheckedChange={(checked) => setForm({ ...form, hasCertificate: !!checked })} />
              <Label htmlFor="edit-class-certificate" className="cursor-pointer font-medium">Certificate Earned</Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-notes">Notes</Label>
            <Textarea id="edit-class-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Key takeaways or notes..." />
          </div>
        </div>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} className="sm:mr-auto">
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ParentingClassesView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: classes, isLoading } = useParentingClasses(activeCaseId)
  const createMutation = useCreateItem('parenting-classes')
  const updateMutation = useUpdateItem('parenting-classes')
  const [editClass, setEditClass] = useState<ParentingClass | null>(null)
  // Use refs for mutation tracking to avoid stale closures (same pattern as drug testing fix)
  const mutatingOrientationsRef = useRef<Set<number>>(new Set())
  const [mutatingOrientationsVersion, setMutatingOrientationsVersion] = useState(0)
  const mutatingClassesRef = useRef<Set<number>>(new Set())
  const [mutatingClassesVersion, setMutatingClassesVersion] = useState(0)
  // Read version states to ensure re-renders when refs change
  void mutatingOrientationsVersion
  void mutatingClassesVersion
  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /><Skeleton className="mt-1 h-8 w-16" /></CardHeader>
            </Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div></CardContent></Card>
      </div>
    )
  }

  const allClasses = classes || []
  
  // Separate orientation from weekly classes (support multiple orientations)
  // Use a more reliable lookup by class name pattern instead of array index
  const orientationClasses = allClasses.filter((c) => c.className?.toLowerCase().includes('orientation'))
  const weeklyClasses = allClasses.filter((c) => !c.className?.toLowerCase().includes('orientation'))
  const completedOrientations = orientationClasses.filter((c) => c.isCompleted).length
  const totalOrientations = 2 // Always 2 orientation classes as per CPS requirements

  // Find orientation class by its number (1 or 2) instead of array index
  function getOrientationByNumber(num: number): ParentingClass | undefined {
    return orientationClasses.find((c) => {
      const name = c.className?.toLowerCase() || ''
      // Match "Parenting Orientation 1" or "Orientation 1" etc.
      return name.includes('orientation') && name.includes(String(num))
    })
  }
  
  const completedWeekly = weeklyClasses.filter((c) => c.isCompleted).length
  const completionRate = TOTAL_WEEKLY_CLASSES > 0 ? Math.round((completedWeekly / TOTAL_WEEKLY_CLASSES) * 100) : 0

  // Determine start date for class schedule (use earliest class date, or default to case removal date)
  const earliestDate = weeklyClasses.length > 0
    ? [...weeklyClasses].sort((a, b) => a.date.slice(0, 10).localeCompare(b.date.slice(0, 10)))[0].date
    : getLocalDateString()
  
  const tuesdayDates = generateTuesdayDates(new Date(earliestDate.slice(0, 10) + 'T12:00:00'))

  // Check if a class entry exists for a given date
  function getClassForDate(date: Date): ParentingClass | undefined {
    const dateStr = getLocalDateString(date)
    return weeklyClasses.find((c) => {
      const classDate = c.date.slice(0, 10)
      return classDate === dateStr
    })
  }

  // Toggle completion for a class by date
  function toggleClassCompletion(classNumber: number, date: Date) {
    // Prevent double-clicking
    if (mutatingClassesRef.current.has(classNumber)) return

    const existing = getClassForDate(date)

    mutatingClassesRef.current = new Set([...mutatingClassesRef.current, classNumber])
    setMutatingClassesVersion(v => v + 1)
    const onDone = () => {
      const next = new Set(mutatingClassesRef.current)
      next.delete(classNumber)
      mutatingClassesRef.current = next
      setMutatingClassesVersion(v => v + 1)
    }

    if (existing) {
      // Update existing class
      updateMutation.mutate(
        { id: existing.id, isCompleted: !existing.isCompleted },
        {
          onSuccess: () => { onDone(); toast.success(existing.isCompleted ? 'Class marked incomplete' : `Class ${classNumber} completed!`) },
          onError: () => { onDone(); toast.error('Failed to update class') },
        }
      )
    } else {
      // Create new class entry
      createMutation.mutate(
        {
          caseId: activeCaseId,
          date: getLocalDateString(date),
          className: `Parenting Class ${classNumber}`,
          isCompleted: true,
        },
        {
          onSuccess: () => { onDone(); toast.success(`Class ${classNumber} completed!`) },
          onError: () => { onDone(); toast.error('Failed to mark class complete') },
        }
      )
    }
  }

  // Handle orientation toggle for a specific orientation class
  function toggleOrientation(orientationNumber: number) {
    // Prevent double-clicking — use ref to avoid stale closure
    if (mutatingOrientationsRef.current.has(orientationNumber)) return

    const existing = getOrientationByNumber(orientationNumber)

    mutatingOrientationsRef.current = new Set([...mutatingOrientationsRef.current, orientationNumber])
    setMutatingOrientationsVersion(v => v + 1)
    const onDone = () => {
      const next = new Set(mutatingOrientationsRef.current)
      next.delete(orientationNumber)
      mutatingOrientationsRef.current = next
      setMutatingOrientationsVersion(v => v + 1)
    }

    if (existing) {
      updateMutation.mutate(
        { id: existing.id, isCompleted: !existing.isCompleted },
        {
          onSuccess: () => { onDone(); toast.success(existing.isCompleted ? `Orientation ${orientationNumber} marked incomplete` : `Orientation ${orientationNumber} completed!`) },
          onError: () => { onDone(); toast.error('Failed to update orientation. Please try again.') },
        }
      )
    } else {
      createMutation.mutate(
        {
          caseId: activeCaseId,
          date: getLocalDateString(),
          className: `Parenting Orientation ${orientationNumber}`,
          isCompleted: true,
          hasCertificate: false,
        },
        {
          onSuccess: () => { onDone(); toast.success(`Orientation ${orientationNumber} completed!`) },
          onError: () => { onDone(); toast.error('Failed to mark orientation. Please try again.') },
        }
      )
    }
  }

  // Toggle certificate for an orientation class
  function toggleOrientationCertificate(orientationNumber: number) {
    const existing = getOrientationByNumber(orientationNumber)
    if (!existing) {
      toast.error('Complete the orientation first, then add the certificate')
      return
    }
    if (mutatingOrientationsRef.current.has(orientationNumber)) return

    mutatingOrientationsRef.current = new Set([...mutatingOrientationsRef.current, orientationNumber])
    setMutatingOrientationsVersion(v => v + 1)
    const onDone = () => {
      const next = new Set(mutatingOrientationsRef.current)
      next.delete(orientationNumber)
      mutatingOrientationsRef.current = next
      setMutatingOrientationsVersion(v => v + 1)
    }

    updateMutation.mutate(
      { id: existing.id, hasCertificate: !existing.hasCertificate },
      {
        onSuccess: () => { onDone(); toast.success(existing.hasCertificate ? 'Certificate removed' : 'Certificate added!') },
        onError: () => { onDone(); toast.error('Failed to update certificate. Please try again.') },
      }
    )
  }

  return (
    <div className="space-y-3 sm:space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-8 sm:size-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20">
                <Target className="size-4 sm:size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-lg sm:text-2xl font-bold">{completedWeekly}/{TOTAL_WEEKLY_CLASSES}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-8 sm:size-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20">
                <GraduationCap className="size-4 sm:size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Progress</p>
                <p className="text-lg sm:text-2xl font-bold text-rose-600">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-8 sm:size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle2 className="size-4 sm:size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Orientation</p>
                <p className="text-lg sm:text-2xl font-bold text-emerald-600">{completedOrientations}/{totalOrientations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-8 sm:size-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Award className="size-4 sm:size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Certificates</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-600">{allClasses.filter((c) => c.hasCertificate).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-rose-200 dark:border-rose-800">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium">Class Completion Progress</span>
            <span className="text-xs sm:text-sm text-rose-600 font-semibold">{completedWeekly}/{TOTAL_WEEKLY_CLASSES} classes</span>
          </div>
          <Progress value={completionRate} className="h-2 sm:h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completionRate === 100 ? '🎉 All classes completed! Great work!' :
             completionRate >= 50 ? `Halfway there! ${TOTAL_WEEKLY_CLASSES - completedWeekly} classes remaining.` :
             `Keep going! ${TOTAL_WEEKLY_CLASSES - completedWeekly} classes to complete.`}
          </p>
        </CardContent>
      </Card>

      {/* Parenting Orientation */}
      <Card className={`border-l-4 ${completedOrientations >= totalOrientations ? 'border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-l-amber-400'}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full ${completedOrientations >= totalOrientations ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                {completedOrientations >= totalOrientations ? (
                  <CheckCircle2 className="size-4 sm:size-5 text-emerald-600" />
                ) : (
                  <GraduationCap className="size-4 sm:size-5 text-amber-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground">Parenting Orientation</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Orientation sessions — required before weekly classes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {completedOrientations >= totalOrientations && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  All Done
                </Badge>
              )}
            </div>
          </div>
          {/* Orientation toggle buttons */}
          <div className="space-y-2">
            {Array.from({ length: totalOrientations }, (_, i) => {
              const num = i + 1
              const oc = getOrientationByNumber(num)
              const isCompleted = oc?.isCompleted ?? false
              const hasCertificate = oc?.hasCertificate ?? false
              return (
                <div
                  key={num}
                  className={`flex items-center gap-2 sm:gap-3 p-2 rounded-lg transition-colors ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/10'
                      : 'bg-amber-50 dark:bg-amber-950/10'
                  }`}
                >
                  <button
                    type="button"
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-all touch-manipulation ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                        : mutatingOrientationsRef.current.has(num)
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-400 cursor-wait'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50 active:scale-95'
                    }`}
                    onClick={() => toggleOrientation(num)}
                    disabled={mutatingOrientationsRef.current.has(num)}
                    aria-label={isCompleted ? `Mark orientation ${num} incomplete` : `Mark orientation ${num} complete`}
                  >
                    {mutatingOrientationsRef.current.has(num) ? <Loader2 className="size-4 animate-spin" /> : isCompleted ? <Check className="size-4" /> : <span className="text-xs font-bold">{num}</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {oc?.className || `Orientation ${num}`}
                    </span>
                    {hasCertificate && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                        <Award className="size-3" />
                        Certificate
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {oc && isCompleted && (
                      <button
                        type="button"
                        className={`flex size-7 items-center justify-center rounded-full transition-all ${
                          hasCertificate
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                        }`}
                        onClick={() => toggleOrientationCertificate(num)}
                        aria-label={hasCertificate ? 'Remove certificate' : 'Add certificate'}
                        title={hasCertificate ? 'Certificate earned' : 'Mark certificate earned'}
                      >
                        <Award className="size-3.5" />
                      </button>
                    )}
                    {oc && (
                      <Button variant="ghost" size="sm" onClick={() => setEditClass(oc)}>
                        <Pencil className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Classes Checklist */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <BookOpen className="size-4 sm:size-5 text-rose-600" />
          Weekly Classes ({TOTAL_WEEKLY_CLASSES})
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">One class every Tuesday for {TOTAL_WEEKLY_CLASSES} weeks. Tap to mark complete.</p>

        <div className="space-y-2">
          {tuesdayDates.map((date, index) => {
            const classNumber = index + 1
            const existingClass = getClassForDate(date)
            const isCompleted = existingClass?.isCompleted ?? false

            return (
              <Card
                key={classNumber}
                className={`transition-all cursor-pointer hover:shadow-sm ${
                  isCompleted
                    ? 'border-l-4 border-l-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-l-4 border-l-rose-300 hover:border-l-rose-400'
                }`}
                onClick={() => {
                  if (existingClass) {
                    setEditClass(existingClass)
                  }
                }}
              >
                <CardContent className="p-2 sm:p-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      className={`flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : mutatingClassesRef.current.has(classNumber)
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-400 cursor-wait'
                          : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-900/50 active:scale-95'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleClassCompletion(classNumber, date)
                      }}
                      disabled={mutatingClassesRef.current.has(classNumber)}
                      aria-label={isCompleted ? `Mark class ${classNumber} incomplete` : `Mark class ${classNumber} complete`}
                    >
                      {mutatingClassesRef.current.has(classNumber) ? <Loader2 className="size-4 sm:size-5 animate-spin" /> : isCompleted ? <Check className="size-4 sm:size-5" /> : <span className="text-xs sm:text-sm font-bold">{classNumber}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-semibold text-foreground">
                          {existingClass?.className || `Class ${classNumber}`}
                        </span>
                        {isCompleted ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">Done</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                        {existingClass?.hasCertificate && (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                            <Award className="size-3" />
                            Certificate
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs sm:text-sm text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        <span>{formatDateShort(date)}</span>
                        {existingClass?.provider && (
                          <span className="hidden sm:inline">• {existingClass.provider}</span>
                        )}
                      </div>
                      {existingClass?.topic && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">{existingClass.topic}</p>
                      )}
                    </div>
                    {existingClass && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditClass(existingClass)
                        }}
                        className="shrink-0"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Edit Class Dialog */}
      {editClass && (
        <EditClassDialog
          parentingClass={editClass}
          open={!!editClass}
          onOpenChange={(open) => { if (!open) setEditClass(null) }}
        />
      )}

    </div>
  )
}

export default ParentingClassesView
