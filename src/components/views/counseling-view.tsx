'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useCounselingSessions,
  useCreateItem,
  useUpdateItem,
} from '@/lib/data-hooks'
import { CATEGORY_COLORS } from '@/lib/types'
import type { CounselingSession } from '@/lib/types'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
  Pencil,
  Loader2,
} from 'lucide-react'

const SESSION_TYPES = ['individual', 'group', 'family', 'couples'] as const

const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  group: 'Group',
  family: 'Family',
  couples: 'Couples',
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  individual: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  group: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  family: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  couples: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}

interface SessionFormData {
  date: string
  counselorName: string
  sessionType: string
  duration: string
  notes: string
  isCompleted: boolean
}

const emptyForm: SessionFormData = {
  date: new Date().toISOString().split('T')[0],
  counselorName: '',
  sessionType: 'individual',
  duration: '60',
  notes: '',
  isCompleted: false,
}

export function CounselingView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: sessions, isLoading } = useCounselingSessions(activeCaseId)
  const createMutation = useCreateItem('counseling')
  const updateMutation = useUpdateItem('counseling')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<CounselingSession | null>(null)
  const [form, setForm] = useState<SessionFormData>(emptyForm)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [prevTrigger, setPrevTrigger] = useState(addDialogTrigger)

  if (addDialogTrigger !== prevTrigger && addDialogTrigger > 0) {
    setPrevTrigger(addDialogTrigger)
    setForm(emptyForm)
    setAddOpen(true)
  }

  // Stats
  const stats = useMemo(() => {
    if (!sessions) return { total: 0, completed: 0, upcoming: 0, rate: 0 }
    const total = sessions.length
    const completed = sessions.filter((s) => s.isCompleted).length
    const upcoming = sessions.filter((s) => !s.isCompleted).length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, upcoming, rate }
  }, [sessions])

  // Filtered and sorted sessions
  const filteredSessions = useMemo(() => {
    if (!sessions) return []
    let filtered = [...sessions]
    if (typeFilter !== 'all') {
      filtered = filtered.filter((s) => s.sessionType === typeFilter)
    }
    if (statusFilter === 'completed') {
      filtered = filtered.filter((s) => s.isCompleted)
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter((s) => !s.isCompleted)
    }
    // Sort: upcoming first (by date asc), then past (by date desc)
    filtered.sort((a, b) => {
      const aUpcoming = !a.isCompleted
      const bUpcoming = !b.isCompleted
      if (aUpcoming && !bUpcoming) return -1
      if (!aUpcoming && bUpcoming) return 1
      if (aUpcoming && bUpcoming) return a.date.localeCompare(b.date)
      return b.date.localeCompare(a.date)
    })
    return filtered
  }, [sessions, typeFilter, statusFilter])

  function handleAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function handleEdit(session: CounselingSession) {
    setEditingSession(session)
    setForm({
      date: session.date ? session.date.split('T')[0] : '',
      counselorName: session.counselorName || '',
      sessionType: session.sessionType || 'individual',
      duration: session.duration?.toString() || '60',
      notes: session.notes || '',
      isCompleted: session.isCompleted,
    })
    setEditOpen(true)
  }

  function submitAdd() {
    if (!activeCaseId) return
    createMutation.mutate(
      {
        caseId: activeCaseId,
        date: form.date,
        counselorName: form.counselorName || null,
        sessionType: form.sessionType,
        duration: form.duration ? parseInt(form.duration) : null,
        notes: form.notes || null,
        isCompleted: form.isCompleted,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
          setForm(emptyForm)
        },
      }
    )
  }

  function submitEdit() {
    if (!editingSession) return
    updateMutation.mutate(
      {
        id: editingSession.id,
        date: form.date,
        counselorName: form.counselorName || null,
        sessionType: form.sessionType,
        duration: form.duration ? parseInt(form.duration) : null,
        notes: form.notes || null,
        isCompleted: form.isCompleted,
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditingSession(null)
        },
      }
    )
  }

  const colors = CATEGORY_COLORS['counseling']

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
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
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
            <Heart className={`size-5 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Counseling Sessions</h2>
            <p className="text-sm text-muted-foreground">Track your counseling progress</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          Add Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <Calendar className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-amber-600">{stats.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.rate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Session Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {SESSION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {SESSION_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Session List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Counseling Sessions Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Every session is a step toward healing. Add your first counseling session to start tracking your progress.
            </p>
            <Button onClick={handleAdd} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4" />
              Add First Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredSessions.map((session) => (
            <Card
              key={session.id}
              className={`transition-colors hover:shadow-md ${
                !session.isCompleted ? 'border-amber-200 dark:border-amber-800' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium">
                        {session.date ? new Date(session.date).toLocaleDateString() : 'No date'}
                      </span>
                      <Badge
                        className={SESSION_TYPE_COLORS[session.sessionType || 'individual']}
                      >
                        {SESSION_TYPE_LABELS[session.sessionType || 'individual']}
                      </Badge>
                      {session.isCompleted ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="size-3" />
                          Done
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <Clock className="size-3" />
                          Upcoming
                        </Badge>
                      )}
                    </div>
                    {session.counselorName && (
                      <p className="text-sm text-muted-foreground">
                        Counselor: {session.counselorName}
                      </p>
                    )}
                    {session.duration && (
                      <p className="text-sm text-muted-foreground">
                        Duration: {session.duration} min
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(session)}
                    className="shrink-0"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Counseling Session</DialogTitle>
            <DialogDescription>Log a new counseling session to your case plan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-date">Date</Label>
              <Input
                id="add-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-counselor">Counselor Name</Label>
              <Input
                id="add-counselor"
                value={form.counselorName}
                onChange={(e) => setForm((f) => ({ ...f, counselorName: e.target.value }))}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(v) => setForm((f) => ({ ...f, sessionType: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SESSION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-duration">Duration (minutes)</Label>
              <Input
                id="add-duration"
                type="number"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Session notes..."
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
              disabled={createMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Counseling Session</DialogTitle>
            <DialogDescription>Update session details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-counselor">Counselor Name</Label>
              <Input
                id="edit-counselor"
                value={form.counselorName}
                onChange={(e) => setForm((f) => ({ ...f, counselorName: e.target.value }))}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(v) => setForm((f) => ({ ...f, sessionType: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SESSION_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                placeholder="60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Session notes..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-completed"
                checked={form.isCompleted}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isCompleted: checked === true }))
                }
              />
              <Label htmlFor="edit-completed" className="cursor-pointer">
                Session completed
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
