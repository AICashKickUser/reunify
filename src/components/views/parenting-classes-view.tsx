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
} from '@/components/ui/dialog'
import {
  GraduationCap,
  Check,
  Award,
  Percent,
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Building,
  FileText,
  Calendar,
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function AddClassDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { activeCaseId } = useAppStore()
  const createMutation = useCreateItem('parenting-classes')
  const [form, setForm] = useState({
    date: '',
    className: '',
    provider: '',
    topic: '',
    isCompleted: false,
    hasCertificate: false,
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
        className: form.className || null,
        provider: form.provider || null,
        topic: form.topic || null,
        isCompleted: form.isCompleted,
        hasCertificate: form.hasCertificate,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          toast.success('Class added successfully')
          onOpenChange(false)
          setForm({
            date: '',
            className: '',
            provider: '',
            topic: '',
            isCompleted: false,
            hasCertificate: false,
            notes: '',
          })
        },
        onError: () => toast.error('Failed to add class'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-rose-600" />
            Add Parenting Class
          </DialogTitle>
          <DialogDescription>
            Record a new parenting class session
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="class-date">Date *</Label>
            <Input
              id="class-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class-name">Class Name</Label>
            <Input
              id="class-name"
              placeholder="e.g., Positive Parenting Workshop"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class-provider">Provider</Label>
            <Input
              id="class-provider"
              placeholder="e.g., Family Services Center"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class-topic">Topic</Label>
            <Input
              id="class-topic"
              placeholder="e.g., Child Development & Discipline"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="class-completed"
                checked={form.isCompleted}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isCompleted: !!checked })
                }
              />
              <Label htmlFor="class-completed" className="cursor-pointer font-medium">
                Completed
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="class-certificate"
                checked={form.hasCertificate}
                onCheckedChange={(checked) =>
                  setForm({ ...form, hasCertificate: !!checked })
                }
              />
              <Label htmlFor="class-certificate" className="cursor-pointer font-medium">
                Certificate Earned
              </Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="class-notes">Notes</Label>
            <Textarea
              id="class-notes"
              placeholder="Key takeaways or notes..."
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
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
  const [form, setForm] = useState({
    date: parentingClass.date
      ? new Date(parentingClass.date).toISOString().split('T')[0]
      : '',
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
          toast.success('Class updated successfully')
          onOpenChange(false)
        },
        onError: () => toast.error('Failed to update class'),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-rose-600" />
            Edit Parenting Class
          </DialogTitle>
          <DialogDescription>
            Update class details and completion status
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-class-date">Date</Label>
            <Input
              id="edit-class-date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-name">Class Name</Label>
            <Input
              id="edit-class-name"
              value={form.className}
              onChange={(e) => setForm({ ...form, className: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-provider">Provider</Label>
            <Input
              id="edit-class-provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-topic">Topic</Label>
            <Input
              id="edit-class-topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-class-completed"
                checked={form.isCompleted}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isCompleted: !!checked })
                }
              />
              <Label htmlFor="edit-class-completed" className="cursor-pointer font-medium">
                Completed
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-class-certificate"
                checked={form.hasCertificate}
                onCheckedChange={(checked) =>
                  setForm({ ...form, hasCertificate: !!checked })
                }
              />
              <Label htmlFor="edit-class-certificate" className="cursor-pointer font-medium">
                Certificate Earned
              </Label>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-class-notes">Notes</Label>
            <Textarea
              id="edit-class-notes"
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
            className="bg-rose-600 hover:bg-rose-700 text-white"
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

function ClassCard({
  parentingClass,
  onEdit,
  onDelete,
}: {
  parentingClass: ParentingClass
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card
      className={`transition-all hover:shadow-md ${
        parentingClass.isCompleted
          ? 'border-l-4 border-l-emerald-400'
          : 'border-l-4 border-l-amber-400'
      }`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {formatDate(parentingClass.date)}
              </span>
              <Badge
                variant="outline"
                className={
                  parentingClass.isCompleted
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }
              >
                {parentingClass.isCompleted ? 'Completed' : 'Pending'}
              </Badge>
              {parentingClass.hasCertificate && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-700 border-amber-200"
                >
                  <Award className="size-3" />
                  Certificate
                </Badge>
              )}
            </div>

            {parentingClass.className && (
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-rose-500 shrink-0" />
                <span className="font-medium text-foreground">
                  {parentingClass.className}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {parentingClass.provider && (
                <span className="flex items-center gap-1">
                  <Building className="size-3.5" />
                  {parentingClass.provider}
                </span>
              )}
              {parentingClass.topic && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {parentingClass.topic}
                </span>
              )}
            </div>

            {parentingClass.notes && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <FileText className="size-3.5 mt-0.5 shrink-0" />
                {parentingClass.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="size-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ParentingClassesView() {
  const { activeCaseId } = useAppStore()
  const { data: classes, isLoading } = useParentingClasses(activeCaseId)
  const deleteMutation = useDeleteItem('parenting-classes')
  const [addOpen, setAddOpen] = useState(false)
  const [editClass, setEditClass] = useState<ParentingClass | null>(null)

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

  const totalClasses = classes?.length || 0
  const completedClasses = classes?.filter((c) => c.isCompleted).length || 0
  const certificatesEarned = classes?.filter((c) => c.hasCertificate).length || 0
  const completionRate =
    totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0

  const sortedClasses = [...(classes || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const completedList = sortedClasses.filter((c) => c.isCompleted)
  const pendingList = sortedClasses.filter((c) => !c.isCompleted)

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Class deleted'),
      onError: () => toast.error('Failed to delete class'),
    })
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4 text-rose-600" />
              Total Classes
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {totalClasses}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-emerald-600" />
              Completed
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {completedClasses}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="size-4 text-amber-600" />
              Certificates Earned
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              {certificatesEarned}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Percent className="size-4 text-rose-600" />
              Completion Rate
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {completionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Class Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Class Log</h2>
        <Button
          className="bg-rose-600 hover:bg-rose-700 text-white"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="size-4" />
          Add Class
        </Button>
      </div>

      {/* Class List */}
      {sortedClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="size-12 text-rose-300 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No parenting classes yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Start tracking your parenting classes to show the court your
              commitment to being the best parent you can be.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <Calendar className="size-4" />
                Pending Classes ({pendingList.length})
              </h3>
              {pendingList.map((cls) => (
                <ClassCard
                  key={cls.id}
                  parentingClass={cls}
                  onEdit={() => setEditClass(cls)}
                  onDelete={() => handleDelete(cls.id)}
                />
              ))}
            </div>
          )}
          {completedList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                <Check className="size-4" />
                Completed Classes ({completedList.length})
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                {completedList.map((cls) => (
                  <ClassCard
                    key={cls.id}
                    parentingClass={cls}
                    onEdit={() => setEditClass(cls)}
                    onDelete={() => handleDelete(cls.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Class Dialog */}
      <AddClassDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Class Dialog */}
      {editClass && (
        <EditClassDialog
          parentingClass={editClass}
          open={!!editClass}
          onOpenChange={(open) => {
            if (!open) setEditClass(null)
          }}
        />
      )}
    </div>
  )
}
