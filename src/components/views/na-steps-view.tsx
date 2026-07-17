'use client'

import { useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useNASteps,
  useCreateItem,
  useUpdateItem,
} from '@/lib/data-hooks'
import { CATEGORY_COLORS, NA_STEP_TITLES } from '@/lib/types'
import type { NAStep } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
  Footprints,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Pencil,
  ShieldCheck,
  Trophy,
} from 'lucide-react'

interface StepFormData {
  stepNumber: string
  title: string
  description: string
  notes: string
  isCompleted: boolean
  completedAt: string
  sponsorName: string
  sponsorVerified: boolean
}

interface MarkCompleteFormData {
  completedAt: string
  sponsorName: string
  sponsorVerified: boolean
  notes: string
}

const emptyStepForm: StepFormData = {
  stepNumber: '1',
  title: '',
  description: '',
  notes: '',
  isCompleted: false,
  completedAt: '',
  sponsorName: '',
  sponsorVerified: false,
}

const emptyCompleteForm: MarkCompleteFormData = {
  completedAt: new Date().toISOString().split('T')[0],
  sponsorName: '',
  sponsorVerified: false,
  notes: '',
}

export function NAStepsView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: steps, isLoading } = useNASteps(activeCaseId)
  const createMutation = useCreateItem('na-steps')
  const updateMutation = useUpdateItem('na-steps')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<NAStep | null>(null)
  const [completingStep, setCompletingStep] = useState<NAStep | null>(null)
  const [addForm, setAddForm] = useState<StepFormData>(emptyStepForm)
  const [editForm, setEditForm] = useState<StepFormData>(emptyStepForm)
  const [completeForm, setCompleteForm] = useState<MarkCompleteFormData>(emptyCompleteForm)

  // Build step map (1-12)
  const stepMap = useMemo(() => {
    const map = new Map<number, NAStep>()
    if (steps) {
      steps.forEach((s) => map.set(s.stepNumber, s))
    }
    return map
  }, [steps])

  const completedCount = useMemo(() => {
    if (!steps) return 0
    return steps.filter((s) => s.isCompleted).length
  }, [steps])

  const progressPercent = useMemo(() => {
    return Math.round((completedCount / 12) * 100)
  }, [completedCount])

  // Find current step (first incomplete)
  const currentStep = useMemo(() => {
    for (let i = 1; i <= 12; i++) {
      const step = stepMap.get(i)
      if (!step || !step.isCompleted) return i
    }
    return 13 // all complete
  }, [stepMap])

  // Determine which steps are missing
  const missingSteps = useMemo(() => {
    const missing: number[] = []
    for (let i = 1; i <= 12; i++) {
      if (!stepMap.has(i)) missing.push(i)
    }
    return missing
  }, [stepMap])

  function handleAddStep() {
    // Pre-fill with first missing step
    const nextMissing = missingSteps[0] || 1
    setAddForm({
      ...emptyStepForm,
      stepNumber: nextMissing.toString(),
      title: NA_STEP_TITLES[nextMissing] || '',
    })
    setAddOpen(true)
  }

  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    handleAddStep()
  }

  function handleEditStep(step: NAStep) {
    setEditingStep(step)
    setEditForm({
      stepNumber: step.stepNumber.toString(),
      title: step.title,
      description: step.description || '',
      notes: step.notes || '',
      isCompleted: step.isCompleted,
      completedAt: step.completedAt ? step.completedAt.split('T')[0] : '',
      sponsorName: step.sponsorName || '',
      sponsorVerified: step.sponsorVerified,
    })
    setEditOpen(true)
  }

  function handleMarkComplete(step: NAStep) {
    setCompletingStep(step)
    setCompleteForm({
      completedAt: new Date().toISOString().split('T')[0],
      sponsorName: step.sponsorName || '',
      sponsorVerified: step.sponsorVerified,
      notes: step.notes || '',
    })
    setCompleteOpen(true)
  }

  function submitAdd() {
    if (!activeCaseId) return
    const stepNum = parseInt(addForm.stepNumber)
    createMutation.mutate(
      {
        caseId: activeCaseId,
        stepNumber: stepNum,
        title: addForm.title || NA_STEP_TITLES[stepNum] || '',
        description: addForm.description || null,
        notes: addForm.notes || null,
        isCompleted: false,
        sponsorVerified: false,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
        },
      }
    )
  }

  function submitEdit() {
    if (!editingStep) return
    updateMutation.mutate(
      {
        id: editingStep.id,
        stepNumber: parseInt(editForm.stepNumber),
        title: editForm.title,
        description: editForm.description || null,
        notes: editForm.notes || null,
        isCompleted: editForm.isCompleted,
        completedAt: editForm.isCompleted && editForm.completedAt ? editForm.completedAt : null,
        sponsorName: editForm.sponsorName || null,
        sponsorVerified: editForm.sponsorVerified,
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditingStep(null)
        },
      }
    )
  }

  function submitComplete() {
    if (!completingStep) return
    updateMutation.mutate(
      {
        id: completingStep.id,
        isCompleted: true,
        completedAt: completeForm.completedAt || null,
        sponsorName: completeForm.sponsorName || null,
        sponsorVerified: completeForm.sponsorVerified,
        notes: completeForm.notes || null,
      },
      {
        onSuccess: () => {
          setCompleteOpen(false)
          setCompletingStep(null)
        },
      }
    )
  }

  const colors = CATEGORY_COLORS['na-steps']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex size-9 items-center justify-center rounded-lg ${colors.bg}`}>
            <Footprints className={`size-5 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">12 Steps Progress</h2>
            <p className="text-sm text-muted-foreground">Your journey through the NA 12 Steps</p>
          </div>
        </div>
        {missingSteps.length > 0 && (
          <Button onClick={handleAddStep} className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="size-4" />
            Add Missing Steps
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-purple-600" />
              <span className="font-semibold">Overall Progress</span>
            </div>
            <span className="text-sm font-medium text-purple-600">
              {completedCount}/12 Steps Completed
            </span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {progressPercent === 100
              ? '🎉 Amazing! You\'ve completed all 12 steps!'
              : progressPercent >= 75
                ? 'Almost there! Keep pushing forward.'
                : progressPercent >= 50
                  ? 'Great progress! You\'re past the halfway point.'
                  : progressPercent >= 25
                    ? 'Nice work! Every step counts.'
                    : 'The journey of a thousand miles begins with a single step.'}
          </p>
        </CardContent>
      </Card>

      {/* 12 Steps Timeline */}
      <div className="relative">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((stepNum) => {
          const step = stepMap.get(stepNum)
          const isCompleted = step?.isCompleted || false
          const isCurrentStep = stepNum === currentStep && !isCompleted
          const isMissing = !step

          return (
            <div key={stepNum} className="relative flex gap-4">
              {/* Timeline line */}
              {stepNum < 12 && (
                <div
                  className={`absolute left-[19px] top-10 h-[calc(100%-8px)] w-0.5 ${
                    isCompleted
                      ? 'bg-emerald-300 dark:bg-emerald-700'
                      : 'bg-gray-200 dark:bg-gray-700 border-dashed'
                  }`}
                  style={{
                    backgroundImage: isCompleted
                      ? 'none'
                      : 'repeating-linear-gradient(to bottom, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)',
                    backgroundSize: '100% 8px',
                    backgroundColor: 'transparent',
                    color: '#d1d5db',
                  }}
                />
              )}

              {/* Step circle */}
              <div className="relative z-10 flex shrink-0 pt-0.5">
                <div
                  className={`flex size-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isCurrentStep
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-5" />
                  ) : (
                    <span className="text-sm font-bold">{stepNum}</span>
                  )}
                </div>
              </div>

              {/* Step content */}
              <div className="flex-1 pb-6">
                <Card
                  className={`transition-all ${
                    isCurrentStep
                      ? 'border-purple-300 dark:border-purple-700 shadow-md'
                      : isCompleted
                        ? 'border-emerald-200 dark:border-emerald-800'
                        : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">Step {stepNum}</span>
                          {isCompleted && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              <CheckCircle2 className="size-3" />
                              Completed
                            </Badge>
                          )}
                          {isCurrentStep && (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              <Circle className="size-3" />
                              Current Step
                            </Badge>
                          )}
                          {isMissing && (
                            <Badge variant="outline" className="text-xs">
                              Not added yet
                            </Badge>
                          )}
                          {step?.sponsorVerified && (
                            <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                              <ShieldCheck className="size-3" />
                              Sponsor Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step?.title || NA_STEP_TITLES[stepNum]}
                        </p>
                        {step?.completedAt && (
                          <p className="text-xs text-emerald-600 mt-1">
                            Completed: {new Date(step.completedAt).toLocaleDateString()}
                          </p>
                        )}
                        {step?.sponsorName && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Sponsor: {step.sponsorName}
                          </p>
                        )}
                        {step?.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {step.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {step && !isCompleted && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkComplete(step)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Complete
                          </Button>
                        )}
                        {step && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStep(step)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Step Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add NA Step</DialogTitle>
            <DialogDescription>Add a step to track your 12-step progress</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Step Number</Label>
              <Select
                value={addForm.stepNumber}
                onValueChange={(v) =>
                  setAddForm((f) => ({
                    ...f,
                    stepNumber: v,
                    title: NA_STEP_TITLES[parseInt(v)] || '',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={n.toString()} disabled={stepMap.has(n)}>
                      Step {n} {stepMap.has(n) ? '(already added)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-title">Title</Label>
              <Textarea
                id="add-title"
                value={addForm.title}
                onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
                rows={3}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-desc">Description (optional)</Label>
              <Textarea
                id="add-desc"
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Personal reflections on this step..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={addForm.notes}
                onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAdd}
              disabled={createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Step Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Step {editForm.stepNumber}</DialogTitle>
            <DialogDescription>Update step details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Textarea
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Personal reflections..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sponsor">Sponsor Name</Label>
              <Input
                id="edit-sponsor"
                value={editForm.sponsorName}
                onChange={(e) => setEditForm((f) => ({ ...f, sponsorName: e.target.value }))}
                placeholder="Sponsor's name"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-sponsor-verified"
                checked={editForm.sponsorVerified}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, sponsorVerified: checked === true }))
                }
              />
              <Label htmlFor="edit-sponsor-verified" className="cursor-pointer">
                Sponsor verified
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-completed"
                checked={editForm.isCompleted}
                onCheckedChange={(checked) =>
                  setEditForm((f) => ({ ...f, isCompleted: checked === true }))
                }
              />
              <Label htmlFor="edit-completed" className="cursor-pointer">
                Step completed
              </Label>
            </div>
            {editForm.isCompleted && (
              <div className="space-y-2">
                <Label htmlFor="edit-completed-at">Completed Date</Label>
                <Input
                  id="edit-completed-at"
                  type="date"
                  value={editForm.completedAt}
                  onChange={(e) => setEditForm((f) => ({ ...f, completedAt: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Complete Dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Step {completingStep?.stepNumber}</DialogTitle>
            <DialogDescription>
              Mark this step as completed in your recovery journey
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3">
              <p className="text-sm text-purple-800 dark:text-purple-200 font-medium">
                {completingStep?.title || NA_STEP_TITLES[completingStep?.stepNumber || 1]}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-date">Completed Date</Label>
              <Input
                id="complete-date"
                type="date"
                value={completeForm.completedAt}
                onChange={(e) => setCompleteForm((f) => ({ ...f, completedAt: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-sponsor">Sponsor Name</Label>
              <Input
                id="complete-sponsor"
                value={completeForm.sponsorName}
                onChange={(e) =>
                  setCompleteForm((f) => ({ ...f, sponsorName: e.target.value }))
                }
                placeholder="Your sponsor's name"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="complete-verified"
                checked={completeForm.sponsorVerified}
                onCheckedChange={(checked) =>
                  setCompleteForm((f) => ({ ...f, sponsorVerified: checked === true }))
                }
              />
              <Label htmlFor="complete-verified" className="cursor-pointer">
                Sponsor verified this step
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complete-notes">Notes</Label>
              <Textarea
                id="complete-notes"
                value={completeForm.notes}
                onChange={(e) => setCompleteForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Reflections on completing this step..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitComplete}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              <CheckCircle2 className="size-4" />
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
