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
    date: parentingClass.date ? new Date(parentingClass.date).toISOString().split('T')[0] : '',
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
        date: form.date ? new Date(form.date).toISOString() : parentingClass.date,
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
            <Label htmlFor="edit-class-date">Date</Label>
            <Input id="edit-class-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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
  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    // For parenting classes, trigger doesn't open add dialog - we use checklist instead
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
  
  // Separate orientation from weekly classes
  const orientationClass = allClasses.find((c) => c.className?.toLowerCase().includes('orientation'))
  const weeklyClasses = allClasses.filter((c) => !c.className?.toLowerCase().includes('orientation'))
  
  const completedWeekly = weeklyClasses.filter((c) => c.isCompleted).length
  const completionRate = TOTAL_WEEKLY_CLASSES > 0 ? Math.round((completedWeekly / TOTAL_WEEKLY_CLASSES) * 100) : 0

  // Determine start date for class schedule (use earliest class date, or default to case removal date)
  const earliestDate = weeklyClasses.length > 0
    ? weeklyClasses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
    : new Date().toISOString()
  
  const tuesdayDates = generateTuesdayDates(new Date(earliestDate))

  // Check if a class entry exists for a given date
  function getClassForDate(date: Date): ParentingClass | undefined {
    const dateStr = date.toISOString().split('T')[0]
    return weeklyClasses.find((c) => {
      const classDate = new Date(c.date).toISOString().split('T')[0]
      return classDate === dateStr
    })
  }

  // Toggle completion for a class by date
  function toggleClassCompletion(classNumber: number, date: Date) {
    const existing = getClassForDate(date)
    
    if (existing) {
      // Update existing class
      updateMutation.mutate(
        { id: existing.id, isCompleted: !existing.isCompleted },
        {
          onSuccess: () => toast.success(existing.isCompleted ? 'Class marked incomplete' : `Class ${classNumber} completed!`),
          onError: () => toast.error('Failed to update class'),
        }
      )
    } else {
      // Create new class entry
      createMutation.mutate(
        {
          caseId: activeCaseId,
          date: date.toISOString(),
          className: `Parenting Class ${classNumber}`,
          isCompleted: true,
        },
        {
          onSuccess: () => toast.success(`Class ${classNumber} completed!`),
          onError: () => toast.error('Failed to mark class complete'),
        }
      )
    }
  }

  // Handle orientation toggle
  function toggleOrientation() {
    if (orientationClass) {
      updateMutation.mutate(
        { id: orientationClass.id, isCompleted: !orientationClass.isCompleted },
        {
          onSuccess: () => toast.success(orientationClass.isCompleted ? 'Orientation marked incomplete' : 'Orientation completed!'),
          onError: () => toast.error('Failed to update orientation'),
        }
      )
    } else {
      createMutation.mutate(
        {
          caseId: activeCaseId,
          date: new Date().toISOString(),
          className: 'Parenting Orientation',
          isCompleted: true,
        },
        {
          onSuccess: () => toast.success('Orientation completed!'),
          onError: () => toast.error('Failed to mark orientation'),
        }
      )
    }
  }

  return (
    <div className="space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 scrollbar-thin">
      {/* Stats Row */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20">
                <Target className="size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedWeekly}/{TOTAL_WEEKLY_CLASSES}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20">
                <GraduationCap className="size-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold text-rose-600">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Orientation</p>
                <p className="text-2xl font-bold text-emerald-600">{orientationClass?.isCompleted ? 'Done' : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <Award className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <p className="text-2xl font-bold text-amber-600">{weeklyClasses.filter((c) => c.hasCertificate).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-rose-200 dark:border-rose-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Class Completion Progress</span>
            <span className="text-sm text-rose-600 font-semibold">{completedWeekly}/{TOTAL_WEEKLY_CLASSES} classes</span>
          </div>
          <Progress value={completionRate} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completionRate === 100 ? '🎉 All classes completed! Great work!' :
             completionRate >= 50 ? `Halfway there! ${TOTAL_WEEKLY_CLASSES - completedWeekly} classes remaining.` :
             `Keep going! ${TOTAL_WEEKLY_CLASSES - completedWeekly} classes to complete.`}
          </p>
        </CardContent>
      </Card>

      {/* Parenting Orientation */}
      <Card className={`border-l-4 ${orientationClass?.isCompleted ? 'border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-l-amber-400'}`}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${orientationClass?.isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                {orientationClass?.isCompleted ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <GraduationCap className="size-5 text-amber-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">Parenting Orientation</h3>
                <p className="text-sm text-muted-foreground">One-time orientation session — required before weekly classes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {orientationClass?.isCompleted && (
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Completed
                </Badge>
              )}
              {orientationClass && (
                <Button variant="ghost" size="sm" onClick={() => setEditClass(orientationClass)}>
                  <Pencil className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Classes Checklist */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="size-5 text-rose-600" />
          Weekly Classes ({TOTAL_WEEKLY_CLASSES})
        </h2>
        <p className="text-sm text-muted-foreground">One class every Tuesday for {TOTAL_WEEKLY_CLASSES} weeks. Tap to mark complete.</p>

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
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 hover:bg-rose-200 dark:hover:bg-rose-900/50'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleClassCompletion(classNumber, date)
                      }}
                      aria-label={isCompleted ? `Mark class ${classNumber} incomplete` : `Mark class ${classNumber} complete`}
                    >
                      {isCompleted ? <Check className="size-5" /> : <span className="text-sm font-bold">{classNumber}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
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
                      <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
                        <Calendar className="size-3.5 shrink-0" />
                        <span>{formatDateShort(date)}</span>
                        {existingClass?.provider && (
                          <span className="hidden sm:inline">• {existingClass.provider}</span>
                        )}
                      </div>
                      {existingClass?.topic && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{existingClass.topic}</p>
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
