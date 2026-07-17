'use client'

import { useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useNAMeetings,
  useCreateItem,
  useUpdateItem,
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
} from 'lucide-react'

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

export function NAMeetingsView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: meetings, isLoading } = useNAMeetings(activeCaseId)
  const createMutation = useCreateItem('na-meetings')
  const updateMutation = useUpdateItem('na-meetings')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<NAMeeting | null>(null)
  const [form, setForm] = useState<MeetingFormData>(emptyForm)
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all')
  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    setForm(emptyForm)
    setAddOpen(true)
  }

  // Stats
  const stats = useMemo(() => {
    if (!meetings) return { total: 0, thisWeek: 0, thisMonth: 0, verificationRate: 0 }
    const total = meetings.length
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisWeek = meetings.filter((m) => {
      const d = new Date(m.date)
      return d >= startOfWeek
    }).length

    const thisMonth = meetings.filter((m) => {
      const d = new Date(m.date)
      return d >= startOfMonth
    }).length

    const verified = meetings.filter((m) => m.isVerified).length
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0

    return { total, thisWeek, thisMonth, verificationRate }
  }, [meetings])

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    if (!meetings) return []
    let filtered = [...meetings]
    if (verifiedFilter === 'verified') {
      filtered = filtered.filter((m) => m.isVerified)
    } else if (verifiedFilter === 'unverified') {
      filtered = filtered.filter((m) => !m.isVerified)
    }
    // Sort by date, most recent first
    filtered.sort((a, b) => b.date.localeCompare(a.date))
    return filtered
  }, [meetings, verifiedFilter])

  function handleAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function handleEdit(meeting: NAMeeting) {
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
  }

  function submitAdd() {
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
        },
      }
    )
  }

  function submitEdit() {
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
        },
      }
    )
  }

  const colors = CATEGORY_COLORS['na-meetings']

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
            <Users className={`size-5 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">NA Meetings</h2>
            <p className="text-sm text-muted-foreground">Log and verify your meeting attendance</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="size-4" />
          Add Meeting
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <Calendar className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-violet-600">{stats.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <CalendarDays className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-violet-600">{stats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <BadgeCheck className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.verificationRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meetings</SelectItem>
            <SelectItem value="verified">Verified Only</SelectItem>
            <SelectItem value="unverified">Unverified Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meeting List */}
      {filteredMeetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No NA Meetings Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Every meeting strengthens your recovery. Log your first NA meeting to start building your attendance record.
            </p>
            <Button onClick={handleAdd} className="mt-4 bg-violet-600 hover:bg-violet-700 text-white">
              <Plus className="size-4" />
              Add First Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="transition-colors hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-sm font-medium">
                        {meeting.date ? new Date(meeting.date).toLocaleDateString() : 'No date'}
                      </span>
                      {meeting.isVerified ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="size-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Unverified
                        </Badge>
                      )}
                    </div>
                    {meeting.meetingName && (
                      <p className="text-sm font-medium truncate">{meeting.meetingName}</p>
                    )}
                    {meeting.location && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{meeting.location}</span>
                      </p>
                    )}
                    {meeting.speaker && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mic2 className="size-3 shrink-0" />
                        <span className="truncate">{meeting.speaker}</span>
                      </p>
                    )}
                    {meeting.topic && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <BookOpen className="size-3 shrink-0" />
                        <span className="truncate">{meeting.topic}</span>
                      </p>
                    )}
                    {meeting.notes && (
                      <p className="text-sm text-muted-foreground mt-1 truncate italic">
                        {meeting.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(meeting)}
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
            <DialogTitle>Add NA Meeting</DialogTitle>
            <DialogDescription>Log your NA meeting attendance</DialogDescription>
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
              <Label htmlFor="add-name">Meeting Name</Label>
              <Input
                id="add-name"
                value={form.meetingName}
                onChange={(e) => setForm((f) => ({ ...f, meetingName: e.target.value }))}
                placeholder="e.g., Hope & Recovery Group"
              />
            </div>
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
                Attendance verified
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Meeting notes..."
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
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit NA Meeting</DialogTitle>
            <DialogDescription>Update meeting details</DialogDescription>
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
              <Label htmlFor="edit-name">Meeting Name</Label>
              <Input
                id="edit-name"
                value={form.meetingName}
                onChange={(e) => setForm((f) => ({ ...f, meetingName: e.target.value }))}
                placeholder="e.g., Hope & Recovery Group"
              />
            </div>
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
                Attendance verified
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Meeting notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitEdit}
              disabled={updateMutation.isPending}
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
