'use client'

import { useState, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useCommunications,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '@/lib/data-hooks'
import type { CommunicationLog } from '@/lib/types'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MessageSquare,
  Phone,
  Mail,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Voicemail,
  FileText,
  Bell,
} from 'lucide-react'
import { getLocalDateString } from '@/lib/utils'
import { DateInputField } from '@/components/date-input-field'

const CONTACT_TYPES = ['call', 'text', 'email', 'in-person', 'voicemail', 'letter'] as const

const CONTACT_TYPE_LABELS: Record<string, string> = {
  'call': 'Phone Call',
  'text': 'Text Message',
  'email': 'Email',
  'in-person': 'In Person',
  'voicemail': 'Voicemail',
  'letter': 'Letter',
}

const CONTACT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'call': Phone,
  'text': MessageSquare,
  'email': Mail,
  'in-person': Users,
  'voicemail': Voicemail,
  'letter': FileText,
}

const CONTACT_TYPE_COLORS: Record<string, string> = {
  'call': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'text': 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'email': 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'in-person': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  'voicemail': 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  'letter': 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
}

const CONTACT_ROLES = [
  'social-worker', 'attorney', 'judge', 'casa', 'supervisor', 'family', 'other',
] as const

const CONTACT_ROLE_LABELS: Record<string, string> = {
  'social-worker': 'Social Worker',
  'attorney': 'Attorney',
  'judge': 'Judge',
  'casa': 'CASA / Guardian',
  'supervisor': 'Visit Supervisor',
  'family': 'Family Member',
  'other': 'Other',
}

interface CommFormData {
  date: string
  contactType: string
  direction: string
  contactName: string
  contactRole: string
  subject: string
  notes: string
  actionItems: string
  followUpDate: string
  isFollowUpCompleted: boolean
}

const emptyForm: CommFormData = {
  date: getLocalDateString(),
  contactType: 'call',
  direction: 'outgoing',
  contactName: '',
  contactRole: 'social-worker',
  subject: '',
  notes: '',
  actionItems: '',
  followUpDate: '',
  isFollowUpCompleted: false,
}

function isWithinDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const horizon = new Date()
  horizon.setDate(now.getDate() + days)
  return date >= now && date <= horizon
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function CommunicationsView() {
  const { activeCaseId, addDialogTrigger } = useAppStore()
  const { data: logs, isLoading } = useCommunications(activeCaseId)
  const createMutation = useCreateItem('communications')
  const updateMutation = useUpdateItem('communications')
  const deleteMutation = useDeleteItem('communications')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<CommunicationLog | null>(null)
  const [form, setForm] = useState<CommFormData>(emptyForm)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const prevTriggerRef = useRef(addDialogTrigger)

  if (addDialogTrigger !== prevTriggerRef.current && addDialogTrigger > 0) {
    prevTriggerRef.current = addDialogTrigger
    setForm(emptyForm)
    setAddOpen(true)
  }

  // Stats
  const stats = useMemo(() => {
    if (!logs) return { total: 0, thisMonth: 0, pendingFollowUps: 0, dueSoon: 0 }
    const total = logs.length
    const thisMonth = logs.filter((l) => isThisMonth(l.date)).length
    const pendingFollowUps = logs.filter((l) => l.followUpDate && !l.isFollowUpCompleted).length
    const dueSoon = logs.filter((l) => l.followUpDate && !l.isFollowUpCompleted && isWithinDays(l.followUpDate, 7)).length
    return { total, thisMonth, pendingFollowUps, dueSoon }
  }, [logs])

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    if (!logs) return []
    let filtered = [...logs]
    if (typeFilter !== 'all') {
      filtered = filtered.filter((l) => l.contactType === typeFilter)
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter((l) => l.contactRole === roleFilter)
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [logs, typeFilter, roleFilter])

  const handleAdd = () => {
    setForm(emptyForm)
    setAddOpen(true)
  }

  const handleEdit = (log: CommunicationLog) => {
    setEditingLog(log)
    setForm({
      date: log.date ? log.date.slice(0, 10) : getLocalDateString(),
      contactType: log.contactType || 'call',
      direction: log.direction || 'outgoing',
      contactName: log.contactName || '',
      contactRole: log.contactRole || 'social-worker',
      subject: log.subject || '',
      notes: log.notes || '',
      actionItems: log.actionItems || '',
      followUpDate: log.followUpDate ? log.followUpDate.slice(0, 10) : '',
      isFollowUpCompleted: log.isFollowUpCompleted,
    })
    setEditOpen(true)
  }

  const submitAdd = () => {
    if (!activeCaseId) return
    createMutation.mutate(
      {
        caseId: activeCaseId,
        date: form.date,
        contactType: form.contactType,
        direction: form.direction,
        contactName: form.contactName || null,
        contactRole: form.contactRole,
        subject: form.subject || null,
        notes: form.notes || null,
        actionItems: form.actionItems || null,
        followUpDate: form.followUpDate || null,
        isFollowUpCompleted: form.isFollowUpCompleted,
      },
      {
        onSuccess: () => {
          setAddOpen(false)
          setForm(emptyForm)
        },
      }
    )
  }

  const submitEdit = () => {
    if (!editingLog) return
    updateMutation.mutate(
      {
        id: editingLog.id,
        data: {
          date: form.date,
          contactType: form.contactType,
          direction: form.direction,
          contactName: form.contactName || null,
          contactRole: form.contactRole,
          subject: form.subject || null,
          notes: form.notes || null,
          actionItems: form.actionItems || null,
          followUpDate: form.followUpDate || null,
          isFollowUpCompleted: form.isFollowUpCompleted,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditingLog(null)
        },
      }
    )
  }

  const toggleFollowUp = (log: CommunicationLog) => {
    updateMutation.mutate({
      id: log.id,
      data: { ...log, isFollowUpCompleted: !log.isFollowUpCompleted },
    })
  }

  const confirmDelete = () => {
    if (!deleteId) return
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        setDeleteId(null)
      },
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const DirectionIcon = form.direction === 'incoming' ? ArrowDownLeft : ArrowUpRight

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600" />
            Communication Log
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track every call, text, and conversation with your social worker, attorney, and others.
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="size-4" />
          Log Contact
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Logged</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="size-8 text-emerald-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{stats.thisMonth}</p>
              </div>
              <CalendarClock className="size-8 text-sky-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Follow-up</p>
                <p className="text-2xl font-bold">{stats.pendingFollowUps}</p>
              </div>
              <Clock className="size-8 text-amber-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold text-amber-600">{stats.dueSoon}</p>
              </div>
              <Bell className="size-8 text-rose-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Contact Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CONTACT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {CONTACT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Contact Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {CONTACT_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {CONTACT_ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Communication List */}
      {filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Communications Logged Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Keep a record of every call, text, and conversation. This is your proof of what was discussed and agreed &mdash; invaluable in court.
            </p>
            <Button onClick={handleAdd} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="size-4" />
              Log First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const TypeIcon = CONTACT_TYPE_ICONS[log.contactType || 'call'] || Phone
            const isIncoming = log.direction === 'incoming'
            const DirIcon = isIncoming ? ArrowDownLeft : ArrowUpRight
            const followUpDue = log.followUpDate && !log.isFollowUpCompleted
            return (
              <Card
                key={log.id}
                className={`transition-colors hover:shadow-md ${
                  followUpDue && isWithinDays(log.followUpDate, 3)
                    ? 'border-amber-300 dark:border-amber-700'
                    : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Top row: date + type + direction */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-medium">
                          {log.date ? new Date(log.date).toLocaleDateString() : 'No date'}
                        </span>
                        <Badge className={CONTACT_TYPE_COLORS[log.contactType || 'call']}>
                          <TypeIcon className="size-3" />
                          {CONTACT_TYPE_LABELS[log.contactType || 'call']}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <DirIcon className="size-3" />
                          {isIncoming ? 'Incoming' : 'Outgoing'}
                        </Badge>
                      </div>

                      {/* Contact name + role */}
                      {log.contactName && (
                        <p className="text-sm font-medium">
                          {log.contactName}
                          {log.contactRole && (
                            <span className="text-muted-foreground font-normal">
                              {' '}&middot; {CONTACT_ROLE_LABELS[log.contactRole] || log.contactRole}
                            </span>
                          )}
                        </p>
                      )}

                      {/* Subject */}
                      {log.subject && (
                        <p className="text-sm font-medium mt-1">{log.subject}</p>
                      )}

                      {/* Notes */}
                      {log.notes && (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {log.notes}
                        </p>
                      )}

                      {/* Action items */}
                      {log.actionItems && (
                        <div className="mt-2 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-0.5">
                            Action Items
                          </p>
                          <p className="text-sm text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                            {log.actionItems}
                          </p>
                        </div>
                      )}

                      {/* Follow-up */}
                      {log.followUpDate && (
                        <div className="mt-2 flex items-center gap-2">
                          <Checkbox
                            checked={log.isFollowUpCompleted}
                            onCheckedChange={() => toggleFollowUp(log)}
                            id={`followup-${log.id}`}
                          />
                          <Label
                            htmlFor={`followup-${log.id}`}
                            className={`text-sm flex items-center gap-1 cursor-pointer ${
                              log.isFollowUpCompleted ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}
                          >
                            {log.isFollowUpCompleted ? (
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="size-3.5 text-amber-600" />
                            )}
                            Follow-up: {new Date(log.followUpDate).toLocaleDateString()}
                            {followUpDue && isWithinDays(log.followUpDate, 3) && (
                              <span className="text-amber-600 font-medium">&mdash; due soon!</span>
                            )}
                          </Label>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(log)}
                        className="size-8"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(log.id)}
                        className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log a Communication</DialogTitle>
            <DialogDescription>
              Record who you spoke with, what was discussed, and any follow-up needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <DateInputField
              id="add-date"
              label="Date"
              value={form.date}
              onChange={(v) => setForm((f) => ({ ...f, date: v }))}
              helperText="When did this contact happen?"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact Type</Label>
                <Select
                  value={form.contactType}
                  onValueChange={(v) => setForm((f) => ({ ...f, contactType: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CONTACT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={form.direction}
                  onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="size-3" /> Outgoing
                      </span>
                    </SelectItem>
                    <SelectItem value="incoming">
                      <span className="flex items-center gap-2">
                        <ArrowDownLeft className="size-3" /> Incoming
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="add-name">Contact Name</Label>
                <Input
                  id="add-name"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="e.g. Maria Rodriguez"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Role</Label>
                <Select
                  value={form.contactRole}
                  onValueChange={(v) => setForm((f) => ({ ...f, contactRole: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {CONTACT_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-subject">Subject</Label>
              <Input
                id="add-subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief topic — e.g. Visitation schedule update"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="What was discussed? What was said or agreed?"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-actions">Action Items</Label>
              <Textarea
                id="add-actions"
                value={form.actionItems}
                onChange={(e) => setForm((f) => ({ ...f, actionItems: e.target.value }))}
                placeholder="What do you need to do next? One per line."
                rows={2}
              />
            </div>
            <DateInputField
              id="add-followup"
              label="Follow-up Date (optional)"
              value={form.followUpDate}
              onChange={(v) => setForm((f) => ({ ...f, followUpDate: v }))}
              helperText="Set if you need to follow up by a certain date."
            />
            {form.followUpDate && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isFollowUpCompleted}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isFollowUpCompleted: !!v }))}
                  id="add-followup-done"
                />
                <Label htmlFor="add-followup-done" className="text-sm cursor-pointer">
                  Follow-up already completed
                </Label>
              </div>
            )}
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
              Log Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Communication</DialogTitle>
            <DialogDescription>Update the details of this contact.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <DateInputField
              id="edit-date"
              label="Date"
              value={form.date}
              onChange={(v) => setForm((f) => ({ ...f, date: v }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contact Type</Label>
                <Select
                  value={form.contactType}
                  onValueChange={(v) => setForm((f) => ({ ...f, contactType: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CONTACT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={form.direction}
                  onValueChange={(v) => setForm((f) => ({ ...f, direction: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Contact Name</Label>
                <Input
                  id="edit-name"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Role</Label>
                <Select
                  value={form.contactRole}
                  onValueChange={(v) => setForm((f) => ({ ...f, contactRole: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {CONTACT_ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Brief topic"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="What was discussed?"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-actions">Action Items</Label>
              <Textarea
                id="edit-actions"
                value={form.actionItems}
                onChange={(e) => setForm((f) => ({ ...f, actionItems: e.target.value }))}
                placeholder="What do you need to do next?"
                rows={2}
              />
            </div>
            <DateInputField
              id="edit-followup"
              label="Follow-up Date (optional)"
              value={form.followUpDate}
              onChange={(v) => setForm((f) => ({ ...f, followUpDate: v }))}
            />
            {form.followUpDate && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={form.isFollowUpCompleted}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isFollowUpCompleted: !!v }))}
                  id="edit-followup-done"
                />
                <Label htmlFor="edit-followup-done" className="text-sm cursor-pointer">
                  Follow-up completed
                </Label>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this communication?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this log entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CommunicationsView
