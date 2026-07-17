'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import {
  useDrugTests,
  useCreateItem,
  useUpdateItem,
} from '@/lib/data-hooks'
import { CATEGORY_COLORS } from '@/lib/types'
import type { DrugTest } from '@/lib/types'
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  TestTube2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Flame,
  Plus,
  Pencil,
  Loader2,
  Shuffle,
  CalendarCheck,
} from 'lucide-react'

const TEST_TYPES = ['urine', 'hair', 'blood', 'saliva'] as const
const RESULT_OPTIONS = ['negative', 'positive', 'pending', 'diluted', 'refused'] as const

const TEST_TYPE_LABELS: Record<string, string> = {
  urine: 'Urine',
  hair: 'Hair',
  blood: 'Blood',
  saliva: 'Saliva',
}

const RESULT_LABELS: Record<string, string> = {
  negative: 'Negative',
  positive: 'Positive',
  pending: 'Pending',
  diluted: 'Diluted',
  refused: 'Refused',
}

const RESULT_COLORS: Record<string, string> = {
  negative: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  positive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  diluted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  refused: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
}

// Calendar cell colors
const CALENDAR_COLORS: Record<string, string> = {
  negative: 'bg-emerald-500',
  positive: 'bg-red-500',
  pending: 'bg-amber-400',
  diluted: 'bg-yellow-400',
  refused: 'bg-gray-400',
}

interface DrugTestFormData {
  date: string
  testType: string
  isRandom: boolean
  result: string
  testingFacility: string
  notes: string
}

const emptyForm: DrugTestFormData = {
  date: new Date().toISOString().split('T')[0],
  testType: 'urine',
  isRandom: false,
  result: 'pending',
  testingFacility: '',
  notes: '',
}

export function DrugTestingView() {
  const { activeCaseId } = useAppStore()
  const { data: tests, isLoading } = useDrugTests(activeCaseId)
  const createMutation = useCreateItem('drug-tests')
  const updateMutation = useUpdateItem('drug-tests')

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingTest, setEditingTest] = useState<DrugTest | null>(null)
  const [form, setForm] = useState<DrugTestFormData>(emptyForm)
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Stats
  const stats = useMemo(() => {
    if (!tests) return { total: 0, negative: 0, positive: 0, pending: 0, passRate: 0, cleanStreak: 0 }
    const total = tests.length
    const negative = tests.filter((t) => t.result === 'negative').length
    const positive = tests.filter((t) => t.result === 'positive').length
    const pending = tests.filter((t) => t.result === 'pending').length
    const completed = tests.filter((t) => t.result !== 'pending').length
    const passRate = completed > 0 ? Math.round((negative / completed) * 100) : 0

    // Calculate clean streak (consecutive negative days from most recent)
    const sortedByDate = [...tests]
      .filter((t) => t.result !== 'pending')
      .sort((a, b) => b.date.localeCompare(a.date))
    let cleanStreak = 0
    for (const t of sortedByDate) {
      if (t.result === 'negative') cleanStreak++
      else break
    }

    return { total, negative, positive, pending, passRate, cleanStreak }
  }, [tests])

  // Clean streak calendar (last 30 days)
  const calendarDays = useMemo(() => {
    const days: { date: string; result: string | null; label: string }[] = []
    const today = new Date()
    const testMap = new Map<string, string>()
    if (tests) {
      tests.forEach((t) => {
        const dateKey = t.date.split('T')[0]
        // If multiple tests on same day, worst result wins
        const priority: Record<string, number> = { positive: 4, refused: 3, diluted: 2, pending: 1, negative: 0 }
        const existing = testMap.get(dateKey)
        if (!existing || (priority[t.result || ''] ?? 0) > (priority[existing] ?? 0)) {
          testMap.set(dateKey, t.result || 'pending')
        }
      })
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      const result = testMap.get(dateKey) || null
      days.push({
        date: dateKey,
        result,
        label: result
          ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${RESULT_LABELS[result] || result}`
          : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: No test`,
      })
    }
    return days
  }, [tests])

  // Filtered tests
  const filteredTests = useMemo(() => {
    if (!tests) return []
    let filtered = [...tests]
    if (resultFilter !== 'all') {
      filtered = filtered.filter((t) => t.result === resultFilter)
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.testType === typeFilter)
    }
    filtered.sort((a, b) => b.date.localeCompare(a.date))
    return filtered
  }, [tests, resultFilter, typeFilter])

  function handleAdd() {
    setForm(emptyForm)
    setAddOpen(true)
  }

  function handleEdit(test: DrugTest) {
    setEditingTest(test)
    setForm({
      date: test.date ? test.date.split('T')[0] : '',
      testType: test.testType || 'urine',
      isRandom: test.isRandom,
      result: test.result || 'pending',
      testingFacility: test.testingFacility || '',
      notes: test.notes || '',
    })
    setEditOpen(true)
  }

  function submitAdd() {
    if (!activeCaseId) return
    createMutation.mutate(
      {
        caseId: activeCaseId,
        date: form.date,
        testType: form.testType,
        isRandom: form.isRandom,
        result: form.result,
        testingFacility: form.testingFacility || null,
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
    if (!editingTest) return
    updateMutation.mutate(
      {
        id: editingTest.id,
        date: form.date,
        testType: form.testType,
        isRandom: form.isRandom,
        result: form.result,
        testingFacility: form.testingFacility || null,
        notes: form.notes || null,
      },
      {
        onSuccess: () => {
          setEditOpen(false)
          setEditingTest(null)
        },
      }
    )
  }

  const colors = CATEGORY_COLORS['drug-testing']

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
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
            <Skeleton className="h-24 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
            <TestTube2 className={`size-5 ${colors.text}`} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Drug Testing</h2>
            <p className="text-sm text-muted-foreground">Track your drug tests and clean streak</p>
          </div>
        </div>
        <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="size-4" />
          Add Test
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <TestTube2 className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tests</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Negative</p>
                <p className="text-xl font-bold text-emerald-600">{stats.negative}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertTriangle className="size-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Positive</p>
                <p className="text-xl font-bold text-red-600">{stats.positive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <Clock className="size-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="size-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
                <p className="text-xl font-bold">{stats.passRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20">
                <Flame className="size-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clean Streak</p>
                <p className="text-xl font-bold text-orange-600">{stats.cleanStreak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clean Streak Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarCheck className="size-4 text-emerald-600" />
            30-Day Clean Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {calendarDays.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <div
                    className={`size-6 rounded-sm transition-colors cursor-default ${
                      day.result
                        ? CALENDAR_COLORS[day.result] || 'bg-gray-400'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{day.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-emerald-500" />
              Negative
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-red-500" />
              Positive
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-amber-400" />
              Pending
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-yellow-400" />
              Diluted
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
              No test
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            {RESULT_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {RESULT_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Test Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TEST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {TEST_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Test History */}
      {filteredTests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TestTube2 className="mx-auto size-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Drug Tests Yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Every clean test is proof of your commitment. Add your first drug test to start building your clean streak.
            </p>
            <Button onClick={handleAdd} className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="size-4" />
              Add First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTests.map((test) => (
            <Card key={test.id} className="transition-colors hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`size-3 rounded-full shrink-0 ${
                        test.result === 'negative'
                          ? 'bg-emerald-500'
                          : test.result === 'positive'
                            ? 'bg-red-500'
                            : test.result === 'pending'
                              ? 'bg-amber-400'
                              : test.result === 'diluted'
                                ? 'bg-yellow-400'
                                : 'bg-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {test.date ? new Date(test.date).toLocaleDateString() : 'No date'}
                        </span>
                        <Badge className={RESULT_COLORS[test.result || 'pending']}>
                          {RESULT_LABELS[test.result || 'pending']}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {TEST_TYPE_LABELS[test.testType || 'urine']}
                        </Badge>
                        {test.isRandom && (
                          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                            <Shuffle className="size-3" />
                            Random
                          </Badge>
                        )}
                      </div>
                      {(test.testingFacility || test.notes) && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">
                          {[test.testingFacility, test.notes].filter(Boolean).join(' — ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(test)}
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
            <DialogTitle>Add Drug Test</DialogTitle>
            <DialogDescription>Record a new drug test result</DialogDescription>
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
              <Label>Test Type</Label>
              <Select
                value={form.testType}
                onValueChange={(v) => setForm((f) => ({ ...f, testType: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TEST_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="add-random"
                checked={form.isRandom}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isRandom: checked === true }))
                }
              />
              <Label htmlFor="add-random" className="cursor-pointer">
                Random test
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select
                value={form.result}
                onValueChange={(v) => setForm((f) => ({ ...f, result: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESULT_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-facility">Testing Facility</Label>
              <Input
                id="add-facility"
                value={form.testingFacility}
                onChange={(e) => setForm((f) => ({ ...f, testingFacility: e.target.value }))}
                placeholder="Lab name or facility"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
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
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Add Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Drug Test</DialogTitle>
            <DialogDescription>Update drug test details</DialogDescription>
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
              <Label>Test Type</Label>
              <Select
                value={form.testType}
                onValueChange={(v) => setForm((f) => ({ ...f, testType: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TEST_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-random"
                checked={form.isRandom}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isRandom: checked === true }))
                }
              />
              <Label htmlFor="edit-random" className="cursor-pointer">
                Random test
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Result</Label>
              <Select
                value={form.result}
                onValueChange={(v) => setForm((f) => ({ ...f, result: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RESULT_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-facility">Testing Facility</Label>
              <Input
                id="edit-facility"
                value={form.testingFacility}
                onChange={(e) => setForm((f) => ({ ...f, testingFacility: e.target.value }))}
                placeholder="Lab name or facility"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
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
              className="bg-amber-600 hover:bg-amber-700 text-white"
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
