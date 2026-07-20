'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Heart,
  TestTube2,
  Footprints,
  Users,
  Baby,
  GraduationCap,
  Scale,
  ClipboardCheck,
  Printer,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  CircleDot,
  ArrowRight,
  Sparkles,
  Download,
  Shield,
  Loader2,
  Lock,
} from 'lucide-react'
import { FileText } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useCase } from '@/lib/data-hooks'
import { useSubscriptionStore } from '@/lib/subscription'
import { ProBadge } from '@/components/pro-badge'
import { ChartContainer } from '@/components/ui/chart'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { toast } from 'sonner'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CategoryProgress {
  key: string
  label: string
  icon: React.ReactNode
  progress: number
  statLabel: string
  statValue: string
  status: 'completed' | 'on-track' | 'needs-attention' | 'behind'
  color: string
}

function getMotivationalMessage(progress: number): {
  title: string
  message: string
} {
  if (progress >= 90) {
    return {
      title: 'Almost there! 🌟',
      message:
        "You're so close to completing your case plan! Keep pushing forward — your kids are waiting for you.",
    }
  }
  if (progress >= 70) {
    return {
      title: 'Great momentum! 💪',
      message:
        "You're making incredible progress. The finish line is in sight — stay focused and consistent.",
    }
  }
  if (progress >= 50) {
    return {
      title: 'Halfway there! 🎯',
      message:
        "You've come a long way. Every step counts, and you're proving your commitment every day.",
    }
  }
  if (progress >= 25) {
    return {
      title: 'Keep going! 🌱',
      message:
        "You're building a foundation for your family's future. Small steps lead to big changes.",
    }
  }
  return {
    title: 'Your journey starts now 🚀',
    message:
      "Every journey begins with a single step. You've taken the first step by being here. Stay strong and keep showing up.",
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
    case 'on-track':
      return 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
    case 'needs-attention':
      return 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
    case 'behind':
      return 'border-red-400 bg-red-50 dark:bg-red-950/20'
    default:
      return 'border-slate-300 bg-slate-50 dark:bg-slate-950/20'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <CheckCircle className="size-3" />
          Completed
        </Badge>
      )
    case 'on-track':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <TrendingUp className="size-3" />
          On Track
        </Badge>
      )
    case 'needs-attention':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          <AlertTriangle className="size-3" />
          Needs Attention
        </Badge>
      )
    case 'behind':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          <CircleDot className="size-3" />
          Behind
        </Badge>
      )
    default:
      return null
  }
}

function CircularProgress({
  value,
  size = 180,
  strokeWidth = 12,
}: {
  value: number
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size, maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full" style={{ maxWidth: size, maxHeight: size }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-bold text-foreground">{value}%</span>
        <span className="text-xs text-muted-foreground">Overall</span>
      </div>
    </div>
  )
}

function TimelineSummary({
  milestones,
  caseData,
}: {
  milestones: { title: string; isCompleted: boolean; completedAt: string | null; category: string }[]
  caseData: { removalDate: string | null; targetReunificationDate: string | null }
}) {
  const keyMilestones = milestones
    .filter(
      (m) =>
        m.category === 'legal' ||
        m.category === 'recovery' ||
        m.category === 'family' ||
        m.title.toLowerCase().includes('first') ||
        m.title.toLowerCase().includes('removal') ||
        m.title.toLowerCase().includes('reunification')
    )
    .slice(0, 8)

  const timelineItems = [
    ...(caseData.removalDate
      ? [
          {
            title: 'Removal Date',
            date: caseData.removalDate,
            isCompleted: true,
          },
        ]
      : []),
    ...keyMilestones.map((m) => ({
      title: m.title,
      date: m.completedAt || '',
      isCompleted: m.isCompleted,
    })),
    ...(caseData.targetReunificationDate
      ? [
          {
            title: 'Reunification Target',
            date: caseData.targetReunificationDate,
            isCompleted: false,
          },
        ]
      : []),
  ].slice(0, 10)

  return (
    <div className="space-y-0">
      {timelineItems.map((item, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex size-6 items-center justify-center rounded-full border-2 ${
                item.isCompleted
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-slate-300 bg-background'
              }`}
            >
              {item.isCompleted && (
                <CheckCircle className="size-3.5 text-white" />
              )}
            </div>
            {index < timelineItems.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-6 ${
                  item.isCompleted ? 'bg-emerald-300' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
          <div className="pb-6 flex-1">
            <p
              className={`text-sm font-medium ${
                item.isCompleted
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-muted-foreground'
              }`}
            >
              {item.title}
            </p>
            {item.date && (
              <p className="text-xs text-muted-foreground">
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function PrivacyNotice() {
  return (
    <Card className="border-emerald-200 dark:border-emerald-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Shield className="size-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Your Data is Private</p>
            <p className="text-xs text-muted-foreground">
              All case data is stored locally on your device. Reunify does not
              send your information to any external servers. Exported files
              contain your complete case data — store them securely and only
              share with trusted parties like your attorney.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryDialog({ open, onOpenChange, caseData, categories }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caseData: Record<string, unknown>
  categories: CategoryProgress[]
}) {
  const { tier, setUpgradeDialogOpen } = useSubscriptionStore()
  const isPro = tier === 'pro'

  const requirements = (caseData.requirements || []) as Array<Record<string, unknown>>
  const completedReqs = requirements.filter((r) => r.isCompleted)
  const incompleteReqs = requirements.filter((r) => !r.isCompleted)

  const counselingSessions = (caseData.counselingSessions || []) as Array<Record<string, unknown>>
  const completedSessions = counselingSessions.filter((s) => s.isCompleted)

  const drugTests = (caseData.drugTests || []) as Array<Record<string, unknown>>
  const passedTests = drugTests.filter((t) => t.result === 'negative')
  const failedTests = drugTests.filter((t) => t.result === 'positive')
  const pendingTests = drugTests.filter((t) => t.result === 'pending' || !t.result)

  const naSteps = (caseData.naSteps || []) as Array<Record<string, unknown>>
  const completedSteps = naSteps.filter((s) => s.isCompleted)

  const naMeetings = (caseData.naMeetings || []) as Array<Record<string, unknown>>
  const visits = (caseData.supervisedVisits || []) as Array<Record<string, unknown>>
  const completedVisits = visits.filter((v) => v.isCompleted)
  const parentingClasses = (caseData.parentingClasses || []) as Array<Record<string, unknown>>
  const completedClasses = parentingClasses.filter((c) => c.isCompleted)
  const milestones = (caseData.milestones || []) as Array<Record<string, unknown>>
  const completedMilestones = milestones.filter((m) => m.isCompleted)
  const courtDates = (caseData.courtDates || []) as Array<Record<string, unknown>>

  const overallProgress = requirements.length > 0
    ? Math.round((completedReqs.length / requirements.length) * 100)
    : 0

  const onTrackCategories = categories.filter(c => c.status === 'on-track' || c.status === 'completed')
  const needsAttentionCategories = categories.filter(c => c.status === 'needs-attention')
  const behindCategories = categories.filter(c => c.status === 'behind')

  // Full Pro summary text
  const proSummaryText = `REUNIFICATION CASE SUMMARY
Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Case: ${caseData.caseNumber || 'N/A'}
Court: ${caseData.courtName || 'Not specified'}
Caseworker: ${caseData.caseworkerName || 'Not specified'}
Judge: ${caseData.judgeName || 'Not specified'}
Attorney: ${caseData.attorneyName || 'Not specified'}

═══════════════════════════════
OVERALL PROGRESS: ${overallProgress}%
═══════════════════════════════

Requirements Completed: ${completedReqs.length} of ${requirements.length}

───────────────────────────────
ACHIEVEMENTS & COMPLETED ITEMS
───────────────────────────────
${completedReqs.length > 0 ? completedReqs.map((r) => `✓ ${r.title} (${r.category})${r.completedAt ? ' - Completed ' + new Date(r.completedAt as string).toLocaleDateString() : ''}`).join('\n') : 'No requirements completed yet'}

${completedMilestones.length > 0 ? '\nMilestones Achieved:\n' + completedMilestones.map((m) => `★ ${m.title} - ${m.completedAt ? new Date(m.completedAt as string).toLocaleDateString() : 'Date not recorded'}`).join('\n') : ''}

${completedSteps.length > 0 ? '\nNA Steps Completed: ' + completedSteps.length + '/12\n' + completedSteps.map((s) => `  Step ${s.stepNumber}: ✓${s.sponsorVerified ? ' (Sponsor Verified)' : ''}`).join('\n') : ''}

───────────────────────────────
COMPLIANCE DETAILS
───────────────────────────────

Counseling: ${completedSessions.length}/${counselingSessions.length} sessions completed
Drug Testing: ${passedTests.length} clean / ${drugTests.length} total (${failedTests.length} positive, ${pendingTests.length} pending)
NA Meetings: ${naMeetings.length} meetings attended (${naMeetings.filter((m) => m.isVerified).length} verified)
Supervised Visits: ${completedVisits.length}/${visits.length} completed
Parenting Classes: ${completedClasses.length}/${parentingClasses.length} completed (${parentingClasses.filter((c) => c.hasCertificate).length} certificates earned)
Court Dates: ${courtDates.filter((c) => c.isCompleted).length}/${courtDates.length} completed

───────────────────────────────
AREAS ON TRACK
───────────────────────────────
${onTrackCategories.length > 0 ? onTrackCategories.map(c => `✓ ${c.label}: ${c.progress}% - ${c.statValue}`).join('\n') : 'No categories on track yet'}

───────────────────────────────
AREAS NEEDING ATTENTION
───────────────────────────────
${needsAttentionCategories.length > 0 ? needsAttentionCategories.map(c => `⚠ ${c.label}: ${c.progress}% - ${c.statValue}`).join('\n') : 'None - great work!'}

───────────────────────────────
AREAS BEHIND
───────────────────────────────
${behindCategories.length > 0 ? behindCategories.map(c => `✗ ${c.label}: ${c.progress}% - ${c.statValue}`).join('\n') : 'None - keep it up!'}

───────────────────────────────
REMAINING REQUIREMENTS
───────────────────────────────
${incompleteReqs.length > 0 ? incompleteReqs.map((r) => `○ ${r.title} (${r.category})${r.dueDate ? ' - Due: ' + new Date(r.dueDate as string).toLocaleDateString() : ''}`).join('\n') : 'All requirements completed!'}`

  // Basic free summary (minimal)
  const basicSummaryText = `BASIC CASE OVERVIEW
Case: ${caseData.caseNumber || 'N/A'}
Court: ${caseData.courtName || 'Not specified'}

Overall Progress: ${overallProgress}%
Requirements: ${completedReqs.length} of ${requirements.length} completed

Counseling: ${completedSessions.length} sessions
Drug Tests: ${passedTests.length} clean / ${drugTests.length} total
NA Steps: ${completedSteps.length}/12
Visits: ${completedVisits.length} completed
Classes: ${completedClasses.length} completed`

  function handleCopySummary() {
    const textToCopy = isPro ? proSummaryText : basicSummaryText
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('Summary copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy summary')
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-emerald-600" />
            Case Summary Report
          </DialogTitle>
          <DialogDescription>
            {isPro
              ? 'Professional compliance summary for your judge, attorney, or caseworker'
              : 'Basic case overview — upgrade to Pro for the full professional report'}
          </DialogDescription>
        </DialogHeader>

        {isPro ? (
          /* ===== PRO FULL SUMMARY ===== */
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{completedReqs.length}</p>
                <p className="text-xs text-emerald-600">Completed</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{needsAttentionCategories.length + behindCategories.length}</p>
                <p className="text-xs text-amber-600">Needs Work</p>
              </div>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-sky-700">{overallProgress}%</p>
                <p className="text-xs text-sky-600">Overall</p>
              </div>
            </div>

            <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto border">
              {proSummaryText}
            </pre>
          </div>
        ) : (
          /* ===== FREE BASIC SUMMARY + PRO PREVIEW ===== */
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-700">{completedReqs.length}</p>
                <p className="text-xs text-emerald-600">Completed</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-amber-700">{needsAttentionCategories.length + behindCategories.length}</p>
                <p className="text-xs text-amber-600">Needs Work</p>
              </div>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 p-3 text-center">
                <p className="text-2xl font-bold text-sky-700">{overallProgress}%</p>
                <p className="text-xs text-sky-600">Overall</p>
              </div>
            </div>

            {/* Basic summary */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Basic Overview</p>
              <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/50 rounded-lg p-4 max-h-32 overflow-y-auto border">
                {basicSummaryText}
              </pre>
            </div>

            {/* Pro preview - blurred with CTA */}
            <div className="relative">
              <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-md rounded-lg flex flex-col items-center justify-center gap-3 p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-500" />
                  <span className="font-bold text-foreground">Pro Report Preview</span>
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-sm">
                  The Pro report includes achievements, compliance details, areas on track vs. needing attention, remaining requirements, and professional formatting for court.
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => {
                    onOpenChange(false)
                    setUpgradeDialogOpen(true)
                  }}
                >
                  <Sparkles className="size-4" />
                  Upgrade to Pro — $4.99/mo
                </Button>
              </div>
              <div className="pointer-events-none select-none">
                <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">Pro Report Includes:</p>
                <pre className="whitespace-pre-wrap text-xs font-mono bg-muted/50 rounded-lg p-4 max-h-40 overflow-hidden border">
                  {proSummaryText.slice(0, 600)}...
                </pre>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCopySummary} className="gap-2">
            Copy to Clipboard
          </Button>
          <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function generatePDFReport(caseData: Record<string, unknown>, categories: CategoryProgress[]) {
  const requirements = (caseData.requirements || []) as Array<Record<string, unknown>>
  const completedReqs = requirements.filter((r) => r.isCompleted)
  const incompleteReqs = requirements.filter((r) => !r.isCompleted)

  const counselingSessions = (caseData.counselingSessions || []) as Array<Record<string, unknown>>
  const completedSessions = counselingSessions.filter((s) => s.isCompleted)

  const drugTests = (caseData.drugTests || []) as Array<Record<string, unknown>>
  const passedTests = drugTests.filter((t) => t.result === 'negative')
  const failedTests = drugTests.filter((t) => t.result === 'positive')

  const naSteps = (caseData.naSteps || []) as Array<Record<string, unknown>>
  const completedSteps = naSteps.filter((s) => s.isCompleted)
  const sponsorVerifiedCount = completedSteps.filter((s) => s.sponsorVerified).length

  const naMeetings = (caseData.naMeetings || []) as Array<Record<string, unknown>>
  const verifiedMeetings = naMeetings.filter((m) => m.isVerified)

  const visits = (caseData.supervisedVisits || []) as Array<Record<string, unknown>>
  const completedVisits = visits.filter((v) => v.isCompleted)
  const latestVisitType = completedVisits.length > 0
    ? (completedVisits.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime())[0]?.visitType || 'supervised')
    : 'supervised'
  const visitLevelLabel = latestVisitType === 'unsupervised'
    ? 'Unsupervised'
    : latestVisitType === 'semi-supervised'
      ? 'Semi-Supervised'
      : 'Supervised'

  const parentingClasses = (caseData.parentingClasses || []) as Array<Record<string, unknown>>
  const completedClasses = parentingClasses.filter((c) => c.isCompleted)
  const certificatesEarned = parentingClasses.filter((c) => c.hasCertificate).length

  const courtDates = (caseData.courtDates || []) as Array<Record<string, unknown>>
  const completedCourtDates = courtDates.filter((c) => c.isCompleted)
  const nextCourtDate = courtDates
    .filter((c) => !c.isCompleted && new Date(c.date as string) > new Date())
    .sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())[0]

  const milestones = (caseData.milestones || []) as Array<Record<string, unknown>>
  const completedMilestones = milestones.filter((m) => m.isCompleted)

  const overallProgress = requirements.length > 0
    ? Math.round((completedReqs.length / requirements.length) * 100)
    : 0

  // Calculate clean streak
  const sortedTests = [...drugTests].sort(
    (a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
  )
  let cleanStreak = 0
  for (const test of sortedTests) {
    if (test.result === 'negative') {
      cleanStreak++
    } else {
      break
    }
  }

  const drugPassRate = drugTests.length > 0
    ? Math.round((passedTests.length / drugTests.length) * 100)
    : 0

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not specified'

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const caseNumber = caseData.caseNumber || 'N/A'

  const onTrackCategories = categories.filter(c => c.status === 'on-track' || c.status === 'completed')
  const needsAttentionCategories = categories.filter(c => c.status === 'needs-attention')
  const behindCategories = categories.filter(c => c.status === 'behind')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reunification Compliance Report - Case ${caseNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
      line-height: 1.5;
    }
    .page {
      max-width: 850px;
      margin: 0 auto;
      padding: 40px 50px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #059669;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header h1 {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #064e3b;
      margin-bottom: 4px;
    }
    .header .case-num {
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }
    .header .date {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 22px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #fff;
      background: #059669;
      padding: 6px 14px;
      border-radius: 3px;
      margin-bottom: 12px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
    }
    .info-item {
      display: flex;
      gap: 6px;
      font-size: 12px;
      padding: 4px 0;
    }
    .info-label {
      font-weight: 600;
      color: #374151;
      min-width: 120px;
    }
    .info-value {
      color: #1f2937;
    }
    .progress-section {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 16px 20px;
      text-align: center;
      margin-bottom: 22px;
    }
    .progress-big {
      font-size: 48px;
      font-weight: 800;
      color: #059669;
      line-height: 1;
    }
    .progress-label {
      font-size: 13px;
      color: #374151;
      font-weight: 600;
      margin-top: 4px;
    }
    .progress-bar-container {
      width: 100%;
      height: 16px;
      background: #d1fae5;
      border-radius: 8px;
      overflow: hidden;
      margin-top: 10px;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #059669, #10b981);
      border-radius: 8px;
      transition: width 0.3s;
    }
    .category-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .category-table th {
      background: #f3f4f6;
      font-weight: 600;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #d1d5db;
      color: #374151;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .category-table td {
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }
    .category-table tr:nth-child(even) td {
      background: #f9fafb;
    }
    .status-completed { color: #059669; font-weight: 600; }
    .status-on-track { color: #16a34a; font-weight: 600; }
    .status-needs-attention { color: #d97706; font-weight: 600; }
    .status-behind { color: #dc2626; font-weight: 600; }
    .mini-bar {
      display: inline-block;
      width: 60px;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      vertical-align: middle;
      margin-left: 6px;
    }
    .mini-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .item-list {
      list-style: none;
      padding: 0;
    }
    .item-list li {
      padding: 5px 0;
      font-size: 12px;
      border-bottom: 1px solid #f3f4f6;
      display: flex;
      gap: 6px;
    }
    .item-list li:last-child { border-bottom: none; }
    .check { color: #059669; font-weight: 700; }
    .cross { color: #dc2626; font-weight: 700; }
    .warn { color: #d97706; font-weight: 700; }
    .star { color: #d97706; }
    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .col-box {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px;
    }
    .col-box h4 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .col-box.achievements h4 { color: #059669; }
    .col-box.attention h4 { color: #d97706; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #059669;
      text-align: center;
    }
    .footer p {
      font-size: 10px;
      color: #9ca3af;
    }
    .footer .generated {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .footer .privacy {
      font-style: italic;
      margin-top: 8px;
      font-size: 9px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .page { padding: 20px 30px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <h1>REUNIFICATION COMPLIANCE REPORT</h1>
      <div class="case-num">Case #${caseNumber}</div>
      <div class="date">Report Generated: ${today}</div>
    </div>

    <!-- Case Info -->
    <div class="section">
      <div class="section-title">Case Information</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Court:</span><span class="info-value">${caseData.courtName || 'Not specified'}</span></div>
        <div class="info-item"><span class="info-label">Judge:</span><span class="info-value">${caseData.judgeName || 'Not specified'}</span></div>
        <div class="info-item"><span class="info-label">Caseworker:</span><span class="info-value">${caseData.caseworkerName || 'Not specified'}${caseData.caseworkerPhone ? ' (' + caseData.caseworkerPhone + ')' : ''}</span></div>
        <div class="info-item"><span class="info-label">Attorney:</span><span class="info-value">${caseData.attorneyName || 'Not specified'}${caseData.attorneyPhone ? ' (' + caseData.attorneyPhone + ')' : ''}</span></div>
        <div class="info-item"><span class="info-label">Removal Date:</span><span class="info-value">${formatDate(caseData.removalDate as string | null)}</span></div>
        <div class="info-item"><span class="info-label">Target Date:</span><span class="info-value">${formatDate(caseData.targetReunificationDate as string | null)}</span></div>
      </div>
    </div>

    <!-- Overall Progress -->
    <div class="progress-section">
      <div class="progress-big">${overallProgress}%</div>
      <div class="progress-label">Overall Reunification Progress</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${overallProgress}%"></div>
      </div>
      <div style="font-size:11px; color:#374151; margin-top:6px">
        ${completedReqs.length} of ${requirements.length} requirements completed
      </div>
    </div>

    <!-- Compliance Breakdown -->
    <div class="section">
      <div class="section-title">Compliance Breakdown</div>
      <table class="category-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Progress</th>
            <th>Details</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Counseling</strong></td>
            <td>${counselingSessions.length > 0 ? Math.round((completedSessions.length / counselingSessions.length) * 100) : 0}%
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${counselingSessions.length > 0 ? Math.round((completedSessions.length / counselingSessions.length) * 100) : 0}%;background:#10b981"></span></span>
            </td>
            <td>${completedSessions.length}/${counselingSessions.length} sessions completed</td>
            <td class="status-${counselingSessions.length > 0 ? (completedSessions.length / counselingSessions.length >= 1 ? 'completed' : completedSessions.length / counselingSessions.length >= 0.6 ? 'on-track' : completedSessions.length / counselingSessions.length >= 0.3 ? 'needs-attention' : 'behind') : 'behind'}">
              ${counselingSessions.length > 0 ? (completedSessions.length / counselingSessions.length >= 1 ? 'Completed' : completedSessions.length / counselingSessions.length >= 0.6 ? 'On Track' : completedSessions.length / counselingSessions.length >= 0.3 ? 'Needs Attention' : 'Behind') : 'No Data'}
            </td>
          </tr>
          <tr>
            <td><strong>Drug Testing</strong></td>
            <td>${drugPassRate}%
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${drugPassRate}%;background:${drugPassRate >= 80 ? '#10b981' : drugPassRate >= 50 ? '#f59e0b' : '#ef4444'}"></span></span>
            </td>
            <td>${passedTests.length} clean of ${drugTests.length} total (${drugPassRate}% clean rate)${cleanStreak > 0 ? ', ' + cleanStreak + ' clean streak' : ''}${failedTests.length > 0 ? ', ' + failedTests.length + ' positive' : ''}</td>
            <td class="status-${drugTests.length > 0 ? (drugPassRate >= 100 ? 'completed' : drugPassRate >= 80 ? 'on-track' : drugPassRate >= 50 ? 'needs-attention' : 'behind') : 'behind'}">
              ${drugTests.length > 0 ? (drugPassRate >= 100 ? 'Completed' : drugPassRate >= 80 ? 'On Track' : drugPassRate >= 50 ? 'Needs Attention' : 'Behind') : 'No Data'}
            </td>
          </tr>
          <tr>
            <td><strong>NA Steps (12-Step)</strong></td>
            <td>${completedSteps.length}/12
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${Math.round((completedSteps.length / 12) * 100)}%;background:#8b5cf6"></span></span>
            </td>
            <td>${completedSteps.length}/12 steps completed${sponsorVerifiedCount > 0 ? ', ' + sponsorVerifiedCount + ' sponsor-verified' : ''}${naSteps.length > 0 && completedSteps.length < naSteps.length ? ' (' + (naSteps.length - completedSteps.length) + ' remaining)' : ''}</td>
            <td class="status-${completedSteps.length >= 12 ? 'completed' : completedSteps.length >= 7 ? 'on-track' : completedSteps.length >= 3 ? 'needs-attention' : 'behind'}">
              ${completedSteps.length >= 12 ? 'Completed' : completedSteps.length >= 7 ? 'On Track' : completedSteps.length >= 3 ? 'Needs Attention' : 'Behind'}
            </td>
          </tr>
          <tr>
            <td><strong>NA Meetings</strong></td>
            <td>${naMeetings.length > 0 ? Math.round((verifiedMeetings.length / naMeetings.length) * 100) : 0}%
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${naMeetings.length > 0 ? Math.round((verifiedMeetings.length / naMeetings.length) * 100) : 0}%;background:#8b5cf6"></span></span>
            </td>
            <td>${naMeetings.length} attended, ${verifiedMeetings.length} verified</td>
            <td class="status-${naMeetings.length > 0 ? (verifiedMeetings.length / naMeetings.length >= 1 ? 'completed' : verifiedMeetings.length / naMeetings.length >= 0.6 ? 'on-track' : verifiedMeetings.length / naMeetings.length >= 0.3 ? 'needs-attention' : 'behind') : 'behind'}">
              ${naMeetings.length > 0 ? (verifiedMeetings.length / naMeetings.length >= 1 ? 'Completed' : verifiedMeetings.length / naMeetings.length >= 0.6 ? 'On Track' : verifiedMeetings.length / naMeetings.length >= 0.3 ? 'Needs Attention' : 'Behind') : 'No Data'}
            </td>
          </tr>
          <tr>
            <td><strong>Supervised Visits</strong></td>
            <td>${visits.length > 0 ? Math.round((completedVisits.length / visits.length) * 100) : 0}%
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${visits.length > 0 ? Math.round((completedVisits.length / visits.length) * 100) : 0}%;background:#0ea5e9"></span></span>
            </td>
            <td>${completedVisits.length}/${visits.length} completed, Current Level: ${visitLevelLabel}</td>
            <td class="status-${visits.length > 0 ? (completedVisits.length / visits.length >= 1 ? 'completed' : completedVisits.length / visits.length >= 0.6 ? 'on-track' : completedVisits.length / visits.length >= 0.3 ? 'needs-attention' : 'behind') : 'behind'}">
              ${visits.length > 0 ? (completedVisits.length / visits.length >= 1 ? 'Completed' : completedVisits.length / visits.length >= 0.6 ? 'On Track' : completedVisits.length / visits.length >= 0.3 ? 'Needs Attention' : 'Behind') : 'No Data'}
            </td>
          </tr>
          <tr>
            <td><strong>Parenting Classes</strong></td>
            <td>${parentingClasses.length > 0 ? Math.round((completedClasses.length / parentingClasses.length) * 100) : 0}%
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${parentingClasses.length > 0 ? Math.round((completedClasses.length / parentingClasses.length) * 100) : 0}%;background:#f43f5e"></span></span>
            </td>
            <td>${completedClasses.length}/${parentingClasses.length} completed, ${certificatesEarned} certificates earned</td>
            <td class="status-${parentingClasses.length > 0 ? (completedClasses.length / parentingClasses.length >= 1 ? 'completed' : completedClasses.length / parentingClasses.length >= 0.6 ? 'on-track' : completedClasses.length / parentingClasses.length >= 0.3 ? 'needs-attention' : 'behind') : 'behind'}">
              ${parentingClasses.length > 0 ? (completedClasses.length / parentingClasses.length >= 1 ? 'Completed' : completedClasses.length / parentingClasses.length >= 0.6 ? 'On Track' : completedClasses.length / parentingClasses.length >= 0.3 ? 'Needs Attention' : 'Behind') : 'No Data'}
            </td>
          </tr>
          <tr>
            <td><strong>Court Dates</strong></td>
            <td>${courtDates.length > 0 ? Math.round((completedCourtDates.length / courtDates.length) * 100) : 0}%
              <span class="mini-bar"><span class="mini-bar-fill" style="width:${courtDates.length > 0 ? Math.round((completedCourtDates.length / courtDates.length) * 100) : 0}%;background:#64748b"></span></span>
            </td>
            <td>${completedCourtDates.length}/${courtDates.length} completed${nextCourtDate ? ', Next: ' + formatDate(nextCourtDate.date as string) : ', No upcoming dates'}</td>
            <td class="status-${courtDates.length > 0 ? (completedCourtDates.length / courtDates.length >= 1 ? 'completed' : completedCourtDates.length / courtDates.length >= 0.6 ? 'on-track' : completedCourtDates.length / courtDates.length >= 0.3 ? 'needs-attention' : 'behind') : 'behind'}">
              ${courtDates.length > 0 ? (completedCourtDates.length / courtDates.length >= 1 ? 'Completed' : completedCourtDates.length / courtDates.length >= 0.6 ? 'On Track' : completedCourtDates.length / courtDates.length >= 0.3 ? 'Needs Attention' : 'Behind') : 'No Data'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Achievements & Areas Needing Attention -->
    <div class="two-col">
      <div class="col-box achievements">
        <h4>Achievements & Completed Items</h4>
        <ul class="item-list">
          ${completedReqs.length > 0 ? completedReqs.map((r) => '<li><span class="check">\u2713</span> ' + r.title + ' (' + r.category + ')' + (r.completedAt ? ' \u2013 ' + formatDate(r.completedAt as string) : '') + '</li>').join('') : '<li style="color:#9ca3af">No requirements completed yet</li>'}
          ${completedMilestones.length > 0 ? '<li style="padding-top:8px;border-top:1px solid #e5e7eb"><strong>Milestones:</strong></li>' + completedMilestones.map((m) => '<li><span class="star">\u2605</span> ' + m.title + (m.completedAt ? ' \u2013 ' + formatDate(m.completedAt as string) : '') + '</li>').join('') : ''}
        </ul>
      </div>
      <div class="col-box attention">
        <h4>Areas Needing Attention</h4>
        <ul class="item-list">
          ${incompleteReqs.length > 0 ? incompleteReqs.map((r) => '<li><span class="cross">\u25CB</span> ' + r.title + ' (' + r.category + ')' + (r.dueDate ? ' \u2013 Due: ' + formatDate(r.dueDate as string) : '') + '</li>').join('') : '<li style="color:#059669"><span class="check">\u2713</span> All requirements completed!</li>'}
          ${behindCategories.length > 0 ? '<li style="padding-top:8px;border-top:1px solid #e5e7eb"><strong>Behind Schedule:</strong></li>' + behindCategories.map(c => '<li><span class="cross">\u2717</span> ' + c.label + ': ' + c.progress + '% \u2013 ' + c.statValue + '</li>').join('') : ''}
          ${needsAttentionCategories.length > 0 ? '<li style="padding-top:8px;border-top:1px solid #e5e7eb"><strong>Needs Attention:</strong></li>' + needsAttentionCategories.map(c => '<li><span class="warn">\u26A0</span> ' + c.label + ': ' + c.progress + '% \u2013 ' + c.statValue + '</li>').join('') : ''}
        </ul>
      </div>
    </div>

    <!-- NA Steps Detail -->
    ${naSteps.length > 0 ? `
    <div class="section" style="margin-top:22px">
      <div class="section-title">NA Steps Detail</div>
      <table class="category-table">
        <thead>
          <tr><th>Step</th><th>Status</th><th>Sponsor Verified</th><th>Completed Date</th></tr>
        </thead>
        <tbody>
          ${naSteps.map(s => '<tr><td>Step ' + s.stepNumber + '</td><td class="' + (s.isCompleted ? 'status-completed' : '') + '">' + (s.isCompleted ? 'Completed' : 'Incomplete') + '</td><td>' + (s.sponsorVerified ? 'Yes' + (s.sponsorName ? ' (' + s.sponsorName + ')' : '') : 'No') + '</td><td>' + (s.completedAt ? formatDate(s.completedAt as string) : '\u2014') + '</td></tr>').join('')}
        </tbody>
      </table>
    </div>` : ''}

    <!-- Footer -->
    <div class="footer">
      <p class="generated">Generated by Reunify on ${today}</p>
      <p class="privacy">CONFIDENTIAL: This report contains sensitive case information. Store securely and share only with authorized parties such as your attorney, caseworker, or judge. All data is stored locally on the user's device and is not transmitted to any external servers.</p>
    </div>
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error('Please allow popups to generate the PDF report')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  // Wait for content to render then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }
}

export function ProgressView() {
  const { activeCaseId } = useAppStore()
  const { data: caseData, isLoading } = useCase(activeCaseId)
  const [exporting, setExporting] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const { tier, setUpgradeDialogOpen } = useSubscriptionStore()
  const isPro = tier === 'pro'

  async function handleExport() {
    if (!activeCaseId) return
    try {
      setExporting(true)
      const res = await fetch(`/api/export?caseId=${activeCaseId}`)
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reunify-export-${data.case.caseNumber}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Case data exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export case data')
    } finally {
      setExporting(false)
    }
  }

  if (isLoading || !caseData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-8">
          <Skeleton className="size-44 rounded-full" />
          <Skeleton className="mt-4 h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
                <Skeleton className="mt-2 h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Calculate category progress
  const {
    requirements = [],
    counselingSessions = [],
    drugTests = [],
    naSteps = [],
    naMeetings = [],
    supervisedVisits = [],
    parentingClasses = [],
    courtDates = [],
    milestones = [],
  } = caseData

  // Counseling
  const totalCounseling = counselingSessions.length
  const completedCounseling = counselingSessions.filter(
    (s) => s.isCompleted
  ).length
  const counselingRate =
    totalCounseling > 0
      ? Math.round((completedCounseling / totalCounseling) * 100)
      : 0

  // Drug Testing
  const totalDrugTests = drugTests.length
  const passedTests = drugTests.filter(
    (t) => t.result === 'negative'
  ).length
  const drugPassRate =
    totalDrugTests > 0 ? Math.round((passedTests / totalDrugTests) * 100) : 0

  // Calculate clean streak
  const sortedTests = [...drugTests].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  let cleanStreak = 0
  for (const test of sortedTests) {
    if (test.result === 'negative') {
      cleanStreak++
    } else {
      break
    }
  }

  // NA Steps
  const completedSteps = naSteps.filter((s) => s.isCompleted).length
  const stepsProgress =
    naSteps.length > 0
      ? Math.round((completedSteps / 12) * 100)
      : 0

  // NA Meetings
  const totalMeetings = naMeetings.length
  const verifiedMeetings = naMeetings.filter((m) => m.isVerified).length
  const verificationRate =
    totalMeetings > 0
      ? Math.round((verifiedMeetings / totalMeetings) * 100)
      : 0

  // Supervised Visits
  const totalVisits = supervisedVisits.length
  const completedVisits = supervisedVisits.filter(
    (v) => v.isCompleted
  ).length
  const visitProgress =
    totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0

  // Determine visit type level
  const completedVisitsList = supervisedVisits
    .filter((v) => v.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const latestVisitType =
    completedVisitsList[0]?.visitType || 'supervised'
  const visitLevelLabel =
    latestVisitType === 'unsupervised'
      ? 'Unsupervised'
      : latestVisitType === 'semi-supervised'
        ? 'Semi-Supervised'
        : 'Supervised'

  // Parenting Classes
  const totalClasses = parentingClasses.length
  const completedClasses = parentingClasses.filter(
    (c) => c.isCompleted
  ).length
  const certificatesEarned = parentingClasses.filter(
    (c) => c.hasCertificate
  ).length
  const classProgress =
    totalClasses > 0 ? Math.round((completedClasses / totalClasses) * 100) : 0

  // Court Dates
  const totalCourtDates = courtDates.length
  const completedCourtDates = courtDates.filter(
    (c) => c.isCompleted
  ).length
  const nextCourtDate = courtDates
    .filter((c) => !c.isCompleted && new Date(c.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  // Requirements
  const totalRequirements = requirements.length
  const completedRequirements = requirements.filter(
    (r) => r.isCompleted
  ).length
  const reqProgress =
    totalRequirements > 0
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : 0

  // Overall progress
  const overallProgress =
    totalRequirements > 0
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : 0

  // Determine statuses
  function getStatus(progress: number): CategoryProgress['status'] {
    if (progress >= 100) return 'completed'
    if (progress >= 60) return 'on-track'
    if (progress >= 30) return 'needs-attention'
    return 'behind'
  }

  const categories: CategoryProgress[] = [
    {
      key: 'counseling',
      label: 'Counseling',
      icon: <Heart className="size-5 text-emerald-600" />,
      progress: counselingRate,
      statLabel: 'Sessions',
      statValue: `${completedCounseling}/${totalCounseling}`,
      status: getStatus(counselingRate),
      color: 'emerald',
    },
    {
      key: 'drug-testing',
      label: 'Drug Testing',
      icon: <TestTube2 className="size-5 text-amber-600" />,
      progress: drugPassRate,
      statLabel: 'Pass Rate',
      statValue: `${drugPassRate}% (${cleanStreak} clean)`,
      status: getStatus(drugPassRate),
      color: 'amber',
    },
    {
      key: 'na-steps',
      label: '12 Steps',
      icon: <Footprints className="size-5 text-purple-600" />,
      progress: stepsProgress,
      statLabel: 'Steps Completed',
      statValue: `${completedSteps}/12`,
      status: getStatus(stepsProgress),
      color: 'purple',
    },
    {
      key: 'na-meetings',
      label: 'NA Meetings',
      icon: <Users className="size-5 text-violet-600" />,
      progress: verificationRate,
      statLabel: 'Verified',
      statValue: `${verifiedMeetings}/${totalMeetings}`,
      status: getStatus(verificationRate),
      color: 'violet',
    },
    {
      key: 'visits',
      label: 'Visits',
      icon: <Baby className="size-5 text-sky-600" />,
      progress: visitProgress,
      statLabel: 'Level',
      statValue: visitLevelLabel,
      status: getStatus(visitProgress),
      color: 'sky',
    },
    {
      key: 'parenting-classes',
      label: 'Parenting Classes',
      icon: <GraduationCap className="size-5 text-rose-600" />,
      progress: classProgress,
      statLabel: 'Certificates',
      statValue: `${certificatesEarned} earned`,
      status: getStatus(classProgress),
      color: 'rose',
    },
    {
      key: 'court-dates',
      label: 'Court Dates',
      icon: <Scale className="size-5 text-slate-600" />,
      progress:
        totalCourtDates > 0
          ? Math.round((completedCourtDates / totalCourtDates) * 100)
          : 0,
      statLabel: 'Next Date',
      statValue: nextCourtDate
        ? new Date(nextCourtDate.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        : 'None scheduled',
      status:
        totalCourtDates > 0
          ? getStatus(
              Math.round((completedCourtDates / totalCourtDates) * 100)
            )
          : 'behind',
      color: 'slate',
    },
    {
      key: 'requirements',
      label: 'Overall Requirements',
      icon: <ClipboardCheck className="size-5 text-teal-600" />,
      progress: reqProgress,
      statLabel: 'Completed',
      statValue: `${completedRequirements}/${totalRequirements}`,
      status: getStatus(reqProgress),
      color: 'teal',
    },
  ]

  const motivation = getMotivationalMessage(overallProgress)

  // Chart data
  const radarData = categories.map((cat) => ({
    category: cat.label,
    progress: cat.progress,
    fullMark: 100,
  }))

  const barData = categories.map((cat) => ({
    name: cat.label.length > 12 ? cat.label.slice(0, 12) + '…' : cat.label,
    progress: cat.progress,
    fill:
      cat.status === 'completed'
        ? '#10b981'
        : cat.status === 'on-track'
          ? '#22c55e'
          : cat.status === 'needs-attention'
            ? '#f59e0b'
            : '#ef4444',
  }))

  const chartConfig = {
    progress: { label: 'Progress', color: '#10b981' },
    fullMark: { label: 'Target', color: '#e2e8f0' },
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Overall Progress */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-center">
            <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]">
              <CircularProgress value={overallProgress} size={180} />
            </div>
            <div className="text-center sm:text-left max-w-md">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Sparkles className="size-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-foreground">
                  Your Reunification Journey
                </h2>
              </div>
              <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                {motivation.title}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {motivation.message}
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => {
                    if (!isPro) {
                      setUpgradeDialogOpen(true)
                    } else {
                      setSummaryOpen(true)
                    }
                  }}
                >
                  <ClipboardCheck className="size-4" />
                  View Summary
                  {!isPro && <ProBadge />}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (!isPro) {
                      setUpgradeDialogOpen(true)
                    } else if (caseData) {
                      generatePDFReport(caseData as unknown as Record<string, unknown>, categories)
                    }
                  }}
                >
                  <FileText className="size-4" />
                  PDF Report
                  {!isPro && <ProBadge />}
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-4 justify-center sm:justify-start">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {completedRequirements}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {totalRequirements}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Goals</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Progress by Category
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Card
              key={cat.key}
              className={`border-l-4 ${getStatusColor(cat.status)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {cat.icon}
                    <span className="font-medium text-sm text-foreground">
                      {cat.label}
                    </span>
                  </div>
                  {getStatusBadge(cat.status)}
                </div>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {cat.statLabel}
                    </span>
                    <span className="font-semibold text-foreground">
                      {cat.statValue}
                    </span>
                  </div>
                  <Progress value={cat.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {cat.progress}%
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts — Pro Feature */}
      <div className="relative">
        {!isPro && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 p-6">
            <Lock className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Detailed Charts</p>
            <p className="text-xs text-muted-foreground text-center">Upgrade to Pro to see radar and comparison charts</p>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              onClick={() => setUpgradeDialogOpen(true)}
            >
              <Sparkles className="size-3.5" />
              Upgrade to Pro
            </Button>
          </div>
        )}
        <div className={`grid gap-6 lg:grid-cols-2 ${!isPro ? 'pointer-events-none' : ''}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[220px] sm:max-h-[300px] w-full">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Progress"
                  dataKey="progress"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-video w-full">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Progress']}
                />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Timeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-5 text-emerald-600" />
            Key Milestones Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No milestones tracked yet. Complete activities to see your
              progress here.
            </p>
          ) : (
            <TimelineSummary milestones={milestones} caseData={caseData} />
          )}
        </CardContent>
      </Card>

      {/* Export & Report */}
      <Separator />
      <div className="space-y-4 py-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground text-center">
            Export your complete case data or print a progress report to share
            with your caseworker, attorney, or judge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => {
                if (!isPro) {
                  setUpgradeDialogOpen(true)
                } else {
                  setSummaryOpen(true)
                }
              }}
            >
              <ClipboardCheck className="size-4" />
              Summary
              {!isPro && <ProBadge />}
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                if (!isPro) {
                  setUpgradeDialogOpen(true)
                } else {
                  handleExport()
                }
              }}
              disabled={exporting && isPro}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {exporting ? 'Exporting...' : 'Export Case Data'}
              {!isPro && <ProBadge />}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (!isPro) {
                  setUpgradeDialogOpen(true)
                } else if (caseData) {
                  generatePDFReport(caseData as unknown as Record<string, unknown>, categories)
                }
              }}
            >
              <FileText className="size-4" />
              PDF Report
              {!isPro && <ProBadge />}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.print()}
            >
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>
        <PrivacyNotice />
      </div>

      <SummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        caseData={caseData}
        categories={categories}
      />
    </div>
  )
}
