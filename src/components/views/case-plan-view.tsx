'use client'

import { useState, useMemo } from 'react'
import { format, differenceInDays, parseISO, isPast } from 'date-fns'
import {
  ClipboardList, Plus, Edit, Trash2, Phone, User, Gavel,
  CalendarDays, StickyNote, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Loader2, Building2, RefreshCw
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useCase, useRequirements, useCreateItem, useUpdateItem, useDeleteItem, useResetCase } from '@/lib/data-hooks'
import { CATEGORY_COLORS, type CaseRequirement } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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

const CATEGORIES = [
  { value: 'counseling', label: 'Counseling' },
  { value: 'drug-testing', label: 'Drug Testing' },
  { value: 'na-meetings', label: 'NA Meetings' },
  { value: 'na-steps', label: 'NA Steps' },
  { value: 'supervised-visits', label: 'Supervised Visits' },
  { value: 'parenting-classes', label: 'Parenting Classes' },
  { value: 'housing', label: 'Housing' },
  { value: 'employment', label: 'Employment' },
  { value: 'other', label: 'Other' },
] as const

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'as-needed', label: 'As Needed' },
  { value: 'one-time', label: 'One Time' },
] as const

function getCategoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat
}

function getRequirementStatus(req: CaseRequirement): 'completed' | 'overdue' | 'pending' {
  if (req.isCompleted) return 'completed'
  if (req.dueDate && isPast(parseISO(req.dueDate))) return 'overdue'
  return 'pending'
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

function AddRequirementDialog({ open, onOpenChange, caseId }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseId: string
}) {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const createMutation = useCreateItem('requirements')

  const resetForm = () => {
    setCategory('')
    setTitle('')
    setDescription('')
    setFrequency('')
    setDueDate(undefined)
  }

  const handleSubmit = () => {
    if (!category || !title) return
    createMutation.mutate({
      caseId,
      category,
      title,
      description: description || null,
      frequency: frequency || null,
      dueDate: dueDate ? dueDate.toISOString() : null,
      isCompleted: false,
      sortOrder: 0,
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
          <DialogTitle>Add Requirement</DialogTitle>
          <DialogDescription>Add a new requirement to your case plan</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Requirement title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the requirement..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DatePickerField value={dueDate} onChange={setDueDate} label="Due Date" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetForm() }}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!category || !title || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add Requirement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditRequirementDialog({ open, onOpenChange, requirement }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  requirement: CaseRequirement | null
}) {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const updateMutation = useUpdateItem('requirements')

  useState(() => {
    if (requirement) {
      setCategory(requirement.category)
      setTitle(requirement.title)
      setDescription(requirement.description ?? '')
      setFrequency(requirement.frequency ?? '')
      setDueDate(requirement.dueDate ? parseISO(requirement.dueDate) : undefined)
    }
  })

  // Sync form when requirement changes
  const syncForm = (req: CaseRequirement) => {
    setCategory(req.category)
    setTitle(req.title)
    setDescription(req.description ?? '')
    setFrequency(req.frequency ?? '')
    setDueDate(req.dueDate ? parseISO(req.dueDate) : undefined)
  }

  // Use effect alternative - sync on open
  if (requirement && open && category !== requirement.category) {
    syncForm(requirement)
  }

  const handleSubmit = () => {
    if (!requirement || !category || !title) return
    updateMutation.mutate({
      id: requirement.id,
      category,
      title,
      description: description || null,
      frequency: frequency || null,
      dueDate: dueDate ? dueDate.toISOString() : null,
    }, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Requirement</DialogTitle>
          <DialogDescription>Update requirement details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Requirement title" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the requirement..." rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DatePickerField value={dueDate} onChange={setDueDate} label="Due Date" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!category || !title || updateMutation.isPending}
          >
            {updateMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditCaseDialog({ open, onOpenChange, caseData }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: NonNullable<ReturnType<typeof useCase>['data']>
}) {
  const [caseNumber, setCaseNumber] = useState(caseData.caseNumber)
  const [courtName, setCourtName] = useState(caseData.courtName ?? '')
  const [caseworkerName, setCaseworkerName] = useState(caseData.caseworkerName ?? '')
  const [caseworkerPhone, setCaseworkerPhone] = useState(caseData.caseworkerPhone ?? '')
  const [attorneyName, setAttorneyName] = useState(caseData.attorneyName ?? '')
  const [attorneyPhone, setAttorneyPhone] = useState(caseData.attorneyPhone ?? '')
  const [judgeName, setJudgeName] = useState(caseData.judgeName ?? '')
  const [removalDate, setRemovalDate] = useState<Date | undefined>(
    caseData.removalDate ? parseISO(caseData.removalDate) : undefined
  )
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    caseData.targetReunificationDate ? parseISO(caseData.targetReunificationDate) : undefined
  )

  const updateMutation = useUpdateItem('cases')

  const handleSubmit = () => {
    updateMutation.mutate({
      id: caseData.id,
      caseNumber,
      courtName: courtName || null,
      caseworkerName: caseworkerName || null,
      caseworkerPhone: caseworkerPhone || null,
      attorneyName: attorneyName || null,
      attorneyPhone: attorneyPhone || null,
      judgeName: judgeName || null,
      removalDate: removalDate ? removalDate.toISOString() : null,
      targetReunificationDate: targetDate ? targetDate.toISOString() : null,
    }, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Case Details</DialogTitle>
          <DialogDescription>Update your case information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Case Number</Label>
            <Input value={caseNumber} onChange={e => setCaseNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Court Name</Label>
            <Input value={courtName} onChange={e => setCourtName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Caseworker Name</Label>
              <Input value={caseworkerName} onChange={e => setCaseworkerName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Caseworker Phone</Label>
              <Input value={caseworkerPhone} onChange={e => setCaseworkerPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Attorney Name</Label>
              <Input value={attorneyName} onChange={e => setAttorneyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Attorney Phone</Label>
              <Input value={attorneyPhone} onChange={e => setAttorneyPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Judge</Label>
            <Input value={judgeName} onChange={e => setJudgeName(e.target.value)} />
          </div>
          <DatePickerField value={removalDate} onChange={setRemovalDate} label="Removal Date" />
          <DatePickerField value={targetDate} onChange={setTargetDate} label="Target Reunification Date" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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

function CaseInfoCard({ caseData }: { caseData: NonNullable<ReturnType<typeof useCase>['data']> }) {
  const [editOpen, setEditOpen] = useState(false)

  const removalDate = caseData.removalDate ? parseISO(caseData.removalDate) : null
  const targetDate = caseData.targetReunificationDate ? parseISO(caseData.targetReunificationDate) : null
  const now = new Date()

  const daysElapsed = removalDate ? differenceInDays(now, removalDate) : null
  const daysRemaining = targetDate ? differenceInDays(targetDate, now) : null

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-5 text-emerald-600" />
              Case Information
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="size-3.5 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Case Number</p>
                <p className="text-sm font-medium">{caseData.caseNumber}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Court</p>
                <p className="text-sm font-medium">{caseData.courtName || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Caseworker</p>
                <p className="text-sm font-medium">
                  {caseData.caseworkerName || '—'}
                  {caseData.caseworkerPhone && (
                    <span className="text-muted-foreground ml-1">({caseData.caseworkerPhone})</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Attorney</p>
                <p className="text-sm font-medium">
                  {caseData.attorneyName || '—'}
                  {caseData.attorneyPhone && (
                    <span className="text-muted-foreground ml-1">({caseData.attorneyPhone})</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Gavel className="size-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Judge</p>
                <p className="text-sm font-medium">{caseData.judgeName || '—'}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {removalDate && (
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Removal Date</p>
                  <p className="text-sm font-medium">{format(removalDate, 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {targetDate && (
              <div className="flex items-start gap-2">
                <CalendarDays className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Target Reunification</p>
                  <p className="text-sm font-medium">{format(targetDate, 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {daysElapsed !== null && (
              <div className="flex items-start gap-2">
                <Clock className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Days Elapsed</p>
                  <p className="text-sm font-medium">{daysElapsed} days</p>
                </div>
              </div>
            )}
            {daysRemaining !== null && (
              <div className="flex items-start gap-2">
                <AlertTriangle className={`size-4 mt-0.5 shrink-0 ${daysRemaining < 30 ? 'text-red-500' : 'text-emerald-600'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Days Remaining</p>
                  <p className={`text-sm font-medium ${daysRemaining < 30 ? 'text-red-600' : ''}`}>
                    {daysRemaining > 0 ? `${daysRemaining} days` : 'Past due'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditCaseDialog open={editOpen} onOpenChange={setEditOpen} caseData={caseData} />
    </>
  )
}

function ProgressOverview({ requirements }: { requirements: CaseRequirement[] }) {
  const total = requirements.length
  const completed = requirements.filter(r => r.isCompleted).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const categoryBreakdown = useMemo(() => {
    const categories = CATEGORIES.map(c => c.value)
    return categories.map(cat => {
      const catReqs = requirements.filter(r => r.category === cat)
      const catCompleted = catReqs.filter(r => r.isCompleted).length
      const catTotal = catReqs.length
      const catPercent = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0
      return { category: cat, label: getCategoryLabel(cat), completed: catCompleted, total: catTotal, percent: catPercent }
    }).filter(c => c.total > 0)
  }, [requirements])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{completed} of {total} requirements completed</span>
            <span className="font-semibold text-emerald-700">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {categoryBreakdown.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Category</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryBreakdown.map(cb => {
                const colors = CATEGORY_COLORS[cb.category] || CATEGORY_COLORS['other']
                return (
                  <div key={cb.category} className={`rounded-lg border p-3 ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-medium ${colors.text}`}>{cb.label}</span>
                      <span className={`text-xs ${colors.text}`}>{cb.completed}/{cb.total}</span>
                    </div>
                    <Progress value={cb.percent} className="h-1.5" />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RequirementItem({
  req,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  req: CaseRequirement
  onEdit: () => void
  onDelete: () => void
  onToggleComplete: () => void
}) {
  const status = getRequirementStatus(req)
  const colors = CATEGORY_COLORS[req.category] || CATEGORY_COLORS['other']

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
      req.isCompleted ? 'bg-muted/50 opacity-75' : 'bg-background'
    } ${status === 'overdue' ? 'border-red-200 bg-red-50/50' : 'border-border'}`}>
      <Checkbox
        checked={req.isCompleted}
        onCheckedChange={onToggleComplete}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${req.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {req.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {status === 'completed' && (
              <CheckCircle2 className="size-4 text-emerald-600" />
            )}
            {status === 'pending' && (
              <Clock className="size-4 text-amber-500" />
            )}
            {status === 'overdue' && (
              <AlertTriangle className="size-4 text-red-500" />
            )}
          </div>
        </div>
        {req.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
        )}
        <div className="flex items-center flex-wrap gap-1.5">
          {req.frequency && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors.text} ${colors.border} ${colors.bg}`}>
              {req.frequency}
            </Badge>
          )}
          {req.dueDate && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
              status === 'overdue' ? 'text-red-600 border-red-200 bg-red-50' : ''
            }`}>
              <CalendarDays className="size-2.5 mr-0.5" />
              {format(parseISO(req.dueDate), 'MMM d, yyyy')}
            </Badge>
          )}
          {req.notes && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <StickyNote className="size-2.5 mr-0.5" />
              Notes
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <Edit className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function RequirementsList({ requirements }: { requirements: CaseRequirement[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editReq, setEditReq] = useState<CaseRequirement | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const updateMutation = useUpdateItem('requirements')
  const deleteMutation = useDeleteItem('requirements')
  const resetMutation = useResetCase()
  const [prevTrigger, setPrevTrigger] = useState(addDialogTrigger)

  if (addDialogTrigger !== prevTrigger && addDialogTrigger > 0) {
    setPrevTrigger(addDialogTrigger)
    setAddOpen(true)
  }

  const groupedRequirements = useMemo(() => {
    const groups: Record<string, CaseRequirement[]> = {}
    for (const req of requirements) {
      if (!groups[req.category]) groups[req.category] = []
      groups[req.category].push(req)
    }
    // Sort by defined category order
    const orderedCategories = CATEGORIES.map(c => c.value).filter(c => groups[c])
    return orderedCategories.map(cat => ({
      category: cat,
      label: getCategoryLabel(cat),
      items: groups[cat]!.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
  }, [requirements])

  const handleToggleComplete = (req: CaseRequirement) => {
    updateMutation.mutate({
      id: req.id,
      isCompleted: !req.isCompleted,
      completedAt: !req.isCompleted ? new Date().toISOString() : null,
    })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleResetCase = () => {
    if (!activeCaseId) return
    resetMutation.mutate(activeCaseId, {
      onSuccess: () => {
        setResetDialogOpen(false)
      },
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="size-5 text-emerald-600" />
            Requirements
          </CardTitle>
          <div className="flex items-center gap-2">
            {(requirements.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setResetDialogOpen(true)}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? (
                  <Loader2 className="size-3.5 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5 mr-1" />
                )}
                Start Fresh
              </Button>
            )}
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-3.5 mr-1" />
              Add Requirement
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {groupedRequirements.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="size-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No requirements yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first requirement to get started</p>
            <Button
              className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
              size="sm"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-3.5 mr-1" />
              Add Requirement
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={groupedRequirements.map(g => g.category)} className="w-full">
            {groupedRequirements.map(group => {
              const colors = CATEGORY_COLORS[group.category] || CATEGORY_COLORS['other']
              const completedCount = group.items.filter(r => r.isCompleted).length
              return (
                <AccordionItem key={group.category} value={group.category}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge className={`${colors.bg} ${colors.text} ${colors.border} border`}>
                        {group.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{group.items.length} completed
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {group.items.map(req => (
                        <RequirementItem
                          key={req.id}
                          req={req}
                          onEdit={() => setEditReq(req)}
                          onDelete={() => handleDelete(req.id)}
                          onToggleComplete={() => handleToggleComplete(req)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </CardContent>

      {activeCaseId && (
        <AddRequirementDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          caseId={activeCaseId}
        />
      )}
      <EditRequirementDialog
        open={!!editReq}
        onOpenChange={(open) => { if (!open) setEditReq(null) }}
        requirement={editReq}
      />

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Fresh</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all data from this case (requirements, sessions, tests, meetings, visits, etc.) but keep your case details. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleResetCase}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? (
                <><Loader2 className="size-4 animate-spin mr-1" />Clearing...</>
              ) : (
                'Yes, Clear All Data'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export function CasePlanView() {
  const { activeCaseId } = useAppStore()
  const { data: caseData, isLoading: caseLoading } = useCase(activeCaseId)
  const { data: requirements, isLoading: reqLoading } = useRequirements(activeCaseId)

  if (caseLoading || reqLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
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
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!caseData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ClipboardList className="size-10 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No case data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <CaseInfoCard caseData={caseData} />
      <ProgressOverview requirements={requirements ?? []} />
      <RequirementsList requirements={requirements ?? []} />
    </div>
  )
}
