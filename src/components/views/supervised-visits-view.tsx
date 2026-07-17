'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Baby,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Pencil,
  MapPin,
  User,
  Timer,
  FileText,
  Eye,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import {
  useSupervisedVisits,
  useCreateItem,
  useUpdateItem,
} from '@/lib/data-hooks'
import type { SupervisedVisit } from '@/lib/types'
import { toast } from 'sonner'

const VISIT_TYPE_COLORS: Record<string, string> = {
  supervised: 'bg-sky-100 text-sky-700 border-sky-200',
  'semi-supervised': 'bg-amber-100 text-amber-700 border-amber-200',
  unsupervised: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const BEHAVIOR_COLORS: Record<string, string> = {
  happy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  anxious: 'bg-amber-100 text-amber-700 border-amber-200',
  withdrawn: 'bg-slate-100 text-slate-700 border-slate-200',
  engaged: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  upset: 'bg-red-100 text-red-700 border-red-200',
}

const VISIT_TYPES = ['supervised', 'semi-supervised', 'unsupervised'] as const
const BEHAVIORS = ['happy', 'anxious', 'withdrawn', 'engaged', 'upset'] as const

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function VisitTypeProgression({ visits }: { visits: SupervisedVisit[] }) {
  const completedVisits = visits.filter((v) => v.isCompleted)
  const latestVisit = completedVisits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]

  const currentType = latestVisit?.visitType || 'supervised'
  const currentIndex = VISIT_TYPES.indexOf(
    currentType as (typeof VISIT_TYPES)[number]
  )

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {VISIT_TYPES.map((type, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex

        return (
          <div key={type} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isCurrent
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-medium ${
                  isCompleted
                    ? 'text-emerald-600'
                    : isCurrent
                      ? 'text-amber-600'
                      : 'text-slate-400'
                }`}
              >
                {type === 'semi-supervised'
                  ? 'Semi'
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
            {index < VISIT_TYPES.length - 1 && (
              <ArrowRight
                className={`mx-1 size-4 ${
                  index < currentIndex ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function AddVisitDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { activeCaseId } = useAppStore()
  const createMutation = useCreateItem('supervised-visits')
  const [form, setForm] = useState({
    date: '',
    location: '',
    supervisorName: '',
    duration: '',
    visitType: 'supervised',
    childBehavior: '',
    parentBehavior: '',
    notes: '',
  })

  const handleSubmit = () => {
    if (!form.date) {
      toast.error('Please select a date')
      return
    }
    createMutation.mutate(
      {
        caseId: activeCaseId,
        date: new Date(form.date).toISOString(),
        location: form.location || null,
        supervisorName: form.supervisorName || null,
        duration: form.duration ? parseInt(form.duration) : null,
        visitType: form.visitType,
        childBehavior: form.childBehavior || null,
        parentBehavior: form.parentBehavior || null,
        notes: form.notes || null,
        isCompleted: false,
      },
      {
        onSuccess: () => {
          toast.success('Visit added successfully')
          onOpenChange(false)
          setForm({
            date: '',
            location: '',
            supervisorName: '',
            duration: '',
            visitType: 'supervised',
            childBehavior: '',
            parentBehavior: '',
            notes: '',
          })
        },
        onError: () => toast.error('Failed to add visit'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="size-5 text-sky-600" />
            Schedule Visit
          </DialogTitle>
          <DialogDescription>
            Add a new supervised visitation session
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="visit-date">Date *</Label>
            <Input
              id="visit-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visit-type">Visit Type</Label>
            <Select
              value={form.visitType}
              onValueChange={(v) => setForm({ ...form, visitType: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join('-')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visit-location">Location</Label>
            <Input
              id="visit-location"
              placeholder="e.g., CPS Family Center"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visit-supervisor">Supervisor Name</Label>
            <Input
              id="visit-supervisor"
              placeholder="e.g., Maria Santos"
              value={form.supervisorName}
              onChange={(e) =>
                setForm({ ...form, supervisorName: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visit-duration">Duration (minutes)</Label>
            <Input
              id="visit-duration"
              type="number"
              placeholder="e.g., 60"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Child Behavior</Label>
              <Select
                value={form.childBehavior}
                onValueChange={(v) => setForm({ ...form, childBehavior: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {BEHAVIORS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Parent Behavior</Label>
              <Select
                value={form.parentBehavior}
                onValueChange={(v) => setForm({ ...form, parentBehavior: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {BEHAVIORS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="visit-notes">Notes</Label>
            <Textarea
              id="visit-notes"
              placeholder="Any observations or notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-sky-600 hover:bg-sky-700 text-white"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Visit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditVisitDialog({
  visit,
  open,
  onOpenChange,
}: {
  visit: SupervisedVisit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateMutation = useUpdateItem('supervised-visits')
  const [form, setForm] = useState({
    date: visit.date ? new Date(visit.date).toISOString().split('T')[0] : '',
    location: visit.location || '',
    supervisorName: visit.supervisorName || '',
    duration: visit.duration?.toString() || '',
    visitType: visit.visitType || 'supervised',
    childBehavior: visit.childBehavior || '',
    parentBehavior: visit.parentBehavior || '',
    notes: visit.notes || '',
    isCompleted: visit.isCompleted,
  })

  const handleSubmit = () => {
    updateMutation.mutate(
      {
        id: visit.id,
        date: form.date ? new Date(form.date).toISOString() : visit.date,
        location: form.location || null,
        supervisorName: form.supervisorName || null,
        duration: form.duration ? parseInt(form.duration) : null,
        visitType: form.visitType,
        childBehavior: form.childBehavior || null,
        parentBehavior: form.parentBehavior || null,
        notes: form.notes || null,
        isCompleted: form.isCompleted,
      },
      {
        onSuccess: () => {
          toast.success('Visit updated successfully')
          onOpenChange(false)
        },
        onError: () => toast.error('Failed to update visit'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-sky-600" />
            Edit Visit
          </DialogTitle>
          <DialogDescription>
            Update visit details and status
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Checkbox
              id="visit-completed"
              checked={form.isCompleted}
              onCheckedChange={(checked) =>
                setForm({ ...form, isCompleted: !!checked })
              }
            />
            <Label htmlFor="visit-completed" className="cursor-pointer font-medium">
              Mark as Completed
            </Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-visit-date">Date</Label>
            <Input
              id="edit-visit-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Visit Type</Label>
            <Select
              value={form.visitType}
              onValueChange={(v) => setForm({ ...form, visitType: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .split('-')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join('-')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-visit-location">Location</Label>
            <Input
              id="edit-visit-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-visit-supervisor">Supervisor Name</Label>
            <Input
              id="edit-visit-supervisor"
              value={form.supervisorName}
              onChange={(e) =>
                setForm({ ...form, supervisorName: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-visit-duration">Duration (minutes)</Label>
            <Input
              id="edit-visit-duration"
              type="number"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Child Behavior</Label>
              <Select
                value={form.childBehavior}
                onValueChange={(v) => setForm({ ...form, childBehavior: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {BEHAVIORS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Parent Behavior</Label>
              <Select
                value={form.parentBehavior}
                onValueChange={(v) => setForm({ ...form, parentBehavior: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {BEHAVIORS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-visit-notes">Notes</Label>
            <Textarea
              id="edit-visit-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-sky-600 hover:bg-sky-700 text-white"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VisitCard({
  visit,
  onEdit,
}: {
  visit: SupervisedVisit
  onEdit: () => void
}) {
  return (
    <Card
      className={`transition-all hover:shadow-md ${
        visit.isCompleted ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-amber-400'
      }`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {formatDate(visit.date)}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatTime(visit.date)}
              </span>
              <Badge
                variant="outline"
                className={VISIT_TYPE_COLORS[visit.visitType || 'supervised'] || ''}
              >
                {visit.visitType
                  ?.split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join('-') || 'Supervised'}
              </Badge>
              <Badge
                variant="outline"
                className={
                  visit.isCompleted
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }
              >
                {visit.isCompleted ? 'Completed' : 'Pending'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {visit.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {visit.location}
                </span>
              )}
              {visit.supervisorName && (
                <span className="flex items-center gap-1">
                  <User className="size-3.5" />
                  {visit.supervisorName}
                </span>
              )}
              {visit.duration && (
                <span className="flex items-center gap-1">
                  <Timer className="size-3.5" />
                  {visit.duration} min
                </span>
              )}
            </div>

            {(visit.childBehavior || visit.parentBehavior) && (
              <div className="flex flex-wrap gap-2">
                {visit.childBehavior && (
                  <Badge
                    variant="outline"
                    className={BEHAVIOR_COLORS[visit.childBehavior] || ''}
                  >
                    <Eye className="size-3" />
                    Child: {visit.childBehavior.charAt(0).toUpperCase() + visit.childBehavior.slice(1)}
                  </Badge>
                )}
                {visit.parentBehavior && (
                  <Badge
                    variant="outline"
                    className={BEHAVIOR_COLORS[visit.parentBehavior] || ''}
                  >
                    <Eye className="size-3" />
                    Parent: {visit.parentBehavior.charAt(0).toUpperCase() + visit.parentBehavior.slice(1)}
                  </Badge>
                )}
              </div>
            )}

            {visit.notes && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="size-3.5 mt-0.5 shrink-0" />
                {visit.notes}
              </p>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function SupervisedVisitsView() {
  const { activeCaseId } = useAppStore()
  const { data: visits, isLoading } = useSupervisedVisits(activeCaseId)
  const [addOpen, setAddOpen] = useState(false)
  const [editVisit, setEditVisit] = useState<SupervisedVisit | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1 h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalVisits = visits?.length || 0
  const completedVisits = visits?.filter((v) => v.isCompleted).length || 0
  const upcomingVisits = visits?.filter((v) => !v.isCompleted).length || 0

  const sortedVisits = [...(visits || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const completedVisitList = sortedVisits.filter((v) => v.isCompleted)
  const upcomingVisitList = sortedVisits.filter((v) => !v.isCompleted)

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Baby className="size-4 text-sky-600" />
              Total Visits
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{totalVisits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="size-4 text-emerald-600" />
              Completed
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {completedVisits}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 text-amber-600" />
              Upcoming
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {upcomingVisits}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="size-4 text-violet-600" />
              Current Level
            </div>
          </CardHeader>
          <CardContent>
            <VisitTypeProgression visits={visits || []} />
          </CardContent>
        </Card>
      </div>

      {/* Add Visit Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Visit Log</h2>
        <Button
          className="bg-sky-600 hover:bg-sky-700 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" />
          Schedule Visit
        </Button>
      </div>

      {/* Visit List */}
      {sortedVisits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Baby className="size-12 text-sky-300 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No visits scheduled yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Schedule your first visit to start tracking your progress toward
              unsupervised visitation. Every visit brings you closer to your
              kids.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingVisitList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <Clock className="size-4" />
                Upcoming Visits ({upcomingVisitList.length})
              </h3>
              {upcomingVisitList.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visit}
                  onEdit={() => setEditVisit(visit)}
                />
              ))}
            </div>
          )}
          {completedVisitList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                <CheckCircle className="size-4" />
                Completed Visits ({completedVisitList.length})
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {completedVisitList.map((visit) => (
                  <VisitCard
                    key={visit.id}
                    visit={visit}
                    onEdit={() => setEditVisit(visit)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Visit Dialog */}
      <AddVisitDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Visit Dialog */}
      {editVisit && (
        <EditVisitDialog
          visit={editVisit}
          open={!!editVisit}
          onOpenChange={(open) => {
            if (!open) setEditVisit(null)
          }}
        />
      )}
    </div>
  )
}
