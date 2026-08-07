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
  FileText,
  Crown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useCase } from '@/lib/data-hooks'
import { exportAllData } from '@/lib/client-db'
import { ChartContainer } from '@/components/ui/chart'
import { useProFeature } from '@/lib/subscription'
import { ProBadge } from '@/components/pro-badge'
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
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90 w-full h-full max-w-[180px] max-h-[180px]">
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
        <span className="text-2xl sm:text-4xl font-bold text-foreground">{value}%</span>
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
  caseData: any
  categories: CategoryProgress[]
}) {
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
    navigator.clipboard.writeText(proSummaryText).then(() => {
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
            Professional compliance summary for your judge, attorney, or caseworker
          </DialogDescription>
        </DialogHeader>

        {/* ===== FULL SUMMARY ===== */}
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

// ─── Shared helpers for PDF generation ───
function getPdfData(caseData: Record<string, unknown>) {
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
  const sortedCompletedVisits = [...completedVisits].sort(
    (a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
  )
  const latestVisitType = sortedCompletedVisits.length > 0
    ? (sortedCompletedVisits[0]?.visitType || 'supervised')
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

  return {
    requirements, completedReqs, incompleteReqs,
    counselingSessions, completedSessions,
    drugTests, passedTests, failedTests,
    naSteps, completedSteps, sponsorVerifiedCount,
    naMeetings, verifiedMeetings,
    visits, completedVisits, sortedCompletedVisits, latestVisitType, visitLevelLabel,
    parentingClasses, completedClasses, certificatesEarned,
    courtDates, completedCourtDates, nextCourtDate,
    milestones, completedMilestones,
    overallProgress, sortedTests, cleanStreak, drugPassRate,
    formatDate, today, caseNumber,
  }
}

function writePdfToWindow(html: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    toast.error('Please allow popups to generate the PDF report')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }
}

// ─── BASIC PDF (Free) — simplified, functional but plain ───
function generateBasicPDF(caseData: Record<string, unknown>, categories: CategoryProgress[]) {
  const d = getPdfData(caseData)
  const onTrackCategories = categories.filter(c => c.status === 'on-track' || c.status === 'completed')
  const needsAttentionCategories = categories.filter(c => c.status === 'needs-attention')
  const behindCategories = categories.filter(c => c.status === 'behind')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reunify Progress Report - Case ${d.caseNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; background: #fff; line-height: 1.5; }
    .page { max-width: 800px; margin: 0 auto; padding: 30px 40px; }
    h1 { font-size: 20px; font-weight: 700; color: #064e3b; margin-bottom: 4px; }
    h2 { font-size: 14px; font-weight: 700; color: #374151; margin: 20px 0 8px; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; }
    .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; }
    .info-item { font-size: 12px; padding: 3px 0; }
    .info-label { font-weight: 600; color: #374151; }
    .progress-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 14px; text-align: center; margin: 16px 0; }
    .progress-big { font-size: 36px; font-weight: 800; color: #059669; }
    .progress-sub { font-size: 12px; color: #374151; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 8px 0; }
    th { background: #f3f4f6; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #d1d5db; font-size: 11px; }
    td { padding: 6px 8px; border: 1px solid #e5e7eb; }
    .st-done { color: #059669; font-weight: 600; }
    .st-warn { color: #d97706; font-weight: 600; }
    .st-bad { color: #dc2626; font-weight: 600; }
    ul { list-style: none; padding: 0; }
    li { padding: 4px 0; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
    .ck { color: #059669; font-weight: 700; }
    .up { color: #dc2626; font-weight: 700; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #d1d5db; text-align: center; }
    .footer p { font-size: 10px; color: #9ca3af; }
    .upgrade-note { margin-top: 16px; padding: 10px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; font-size: 11px; color: #92400e; text-align: center; }
    @media print { body { padding: 0; } .page { padding: 20px 30px; } }
  </style>
</head>
<body>
  <div class="page">
    <h1>Reunify Progress Report</h1>
    <div class="meta">Case #${d.caseNumber} &middot; ${d.today}</div>

    <h2>Case Information</h2>
    <div class="info-grid">
      <div class="info-item"><span class="info-label">Court:</span> ${caseData.courtName || 'Not specified'}</div>
      <div class="info-item"><span class="info-label">Judge:</span> ${caseData.judgeName || 'Not specified'}</div>
      <div class="info-item"><span class="info-label">Caseworker:</span> ${caseData.caseworkerName || 'Not specified'}</div>
      <div class="info-item"><span class="info-label">Attorney:</span> ${caseData.attorneyName || 'Not specified'}</div>
      <div class="info-item"><span class="info-label">Removal Date:</span> ${d.formatDate(caseData.removalDate as string | null)}</div>
      <div class="info-item"><span class="info-label">Target Date:</span> ${d.formatDate(caseData.targetReunificationDate as string | null)}</div>
    </div>

    <div class="progress-box">
      <div class="progress-big">${d.overallProgress}%</div>
      <div class="progress-sub">Overall Progress &middot; ${d.completedReqs.length} of ${d.requirements.length} requirements completed</div>
    </div>

    <h2>Compliance Breakdown</h2>
    <table>
      <tr><th>Category</th><th>Progress</th><th>Details</th></tr>
      <tr><td>Counseling</td><td>${d.counselingSessions.length > 0 ? Math.round((d.completedSessions.length / d.counselingSessions.length) * 100) : 0}%</td><td>${d.completedSessions.length}/${d.counselingSessions.length} sessions</td></tr>
      <tr><td>Drug Testing</td><td>${d.drugPassRate}%</td><td>${d.passedTests.length} clean / ${d.drugTests.length} total${d.cleanStreak > 0 ? ', ' + d.cleanStreak + ' streak' : ''}</td></tr>
      <tr><td>12 Steps</td><td>${Math.round((d.completedSteps.length / 12) * 100)}%</td><td>${d.completedSteps.length}/12 steps</td></tr>
      <tr><td>NA Meetings</td><td>${d.naMeetings.length > 0 ? Math.round((d.verifiedMeetings.length / d.naMeetings.length) * 100) : 0}%</td><td>${d.naMeetings.length} attended, ${d.verifiedMeetings.length} verified</td></tr>
      <tr><td>Visits</td><td>${d.visits.length > 0 ? Math.round((d.completedVisits.length / d.visits.length) * 100) : 0}%</td><td>${d.completedVisits.length}/${d.visits.length} (${d.visitLevelLabel})</td></tr>
      <tr><td>Parenting</td><td>${d.parentingClasses.length > 0 ? Math.round((d.completedClasses.length / d.parentingClasses.length) * 100) : 0}%</td><td>${d.completedClasses.length}/${d.parentingClasses.length} classes</td></tr>
      <tr><td>Court Dates</td><td>${d.courtDates.length > 0 ? Math.round((d.completedCourtDates.length / d.courtDates.length) * 100) : 0}%</td><td>${d.completedCourtDates.length}/${d.courtDates.length}${d.nextCourtDate ? ', Next: ' + d.formatDate(d.nextCourtDate.date as string) : ''}</td></tr>
    </table>

    <h2>Completed Requirements</h2>
    <ul>
      ${d.completedReqs.length > 0 ? d.completedReqs.map((r) => '<li><span class="ck">\u2713</span> ' + r.title + ' (' + r.category + ')' + (r.completedAt ? ' \u2013 ' + d.formatDate(r.completedAt as string) : '') + '</li>').join('') : '<li style="color:#9ca3af">No requirements completed yet</li>'}
      ${d.completedMilestones.length > 0 ? '<li style="margin-top:8px;font-weight:600">Milestones:</li>' + d.completedMilestones.map((m) => '<li><span class="ck">\u2605</span> ' + m.title + (m.completedAt ? ' \u2013 ' + d.formatDate(m.completedAt as string) : '') + '</li>').join('') : ''}
    </ul>

    <h2>Remaining Requirements</h2>
    <ul>
      ${d.incompleteReqs.length > 0 ? d.incompleteReqs.map((r) => '<li><span class="up">\u25CB</span> ' + r.title + ' (' + r.category + ')' + (r.dueDate ? ' \u2013 Due: ' + d.formatDate(r.dueDate as string) : '') + '</li>').join('') : '<li class="st-done">All requirements completed!</li>'}
    </ul>

    ${behindCategories.length > 0 || needsAttentionCategories.length > 0 ? `
    <h2>Areas Needing Attention</h2>
    <ul>
      ${behindCategories.map(c => '<li><span class="up">\u2717</span> ' + c.label + ': ' + c.progress + '% \u2013 ' + c.statValue + '</li>').join('')}
      ${needsAttentionCategories.map(c => '<li><span class="st-warn">\u26A0</span> ' + c.label + ': ' + c.progress + '% \u2013 ' + c.statValue + '</li>').join('')}
    </ul>` : ''}
    ${onTrackCategories.length > 0 ? `
    <h2>On Track</h2>
    <ul>
      ${onTrackCategories.map(c => '<li><span class="ck">\u2713</span> ' + c.label + ': ' + c.progress + '% \u2013 ' + c.statValue + '</li>').join('')}
    </ul>` : ''}

    <div class="upgrade-note">
      \u2B50 For a professional court-ready report with verified badge, detailed timelines, and case strength assessment, upgrade to <strong>Reunify Pro</strong>.
    </div>

    <div class="footer">
      <p>Generated by Reunify (Free) on ${d.today}</p>
      <p>CONFIDENTIAL: Store securely. Share only with authorized parties.</p>
    </div>
  </div>
</body>
</html>`

  writePdfToWindow(html)
}

// ─── COURT-READY PDF (Pro) — stunning, professional, court-filing quality ───
function generateCourtReadyPDF(caseData: Record<string, unknown>, categories: CategoryProgress[], _isPro: boolean = true) {
  const d = getPdfData(caseData)
  const onTrackCategories = categories.filter(c => c.status === 'on-track' || c.status === 'completed')
  const needsAttentionCategories = categories.filter(c => c.status === 'needs-attention')
  const behindCategories = categories.filter(c => c.status === 'behind')

  // Verification ID
  const verifyId = 'RV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
  const reportId = 'RPT-' + new Date().toISOString().split('T')[0] + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()

  // Compliance narrative
  const totalReqCount = d.requirements.length
  const compReqCount = d.completedReqs.length
  const narrative = `The parent has completed ${compReqCount} of ${totalReqCount} requirements (${d.overallProgress}%). Drug testing shows ${d.drugPassRate}% clean results over ${d.drugTests.length} tests${d.cleanStreak > 0 ? ' with a ' + d.cleanStreak + '-test clean streak' : ''}. Counseling sessions are ${d.counselingSessions.length > 0 ? Math.round((d.completedSessions.length / d.counselingSessions.length) * 100) : 0}% complete. Supervised visits have progressed to ${d.visitLevelLabel} level.${d.parentingClasses.length > 0 ? ' Parenting classes are ' + Math.round((d.completedClasses.length / d.parentingClasses.length) * 100) + '% complete with ' + d.certificatesEarned + ' certificate(s) earned.' : ''} ${d.naMeetings.length > 0 ? d.naMeetings.length + ' NA meetings have been attended (' + d.verifiedMeetings.length + ' verified).' : ''}`

  // Case Strength Assessment
  const drugScore = Math.min(25, Math.round((d.drugPassRate / 100) * 25))
  const programPct = d.requirements.length > 0 ? (d.completedReqs.length / d.requirements.length) * 100 : 0
  const programScore = Math.min(25, Math.round((programPct / 100) * 25))
  const visitScoreMap: Record<string, number> = { unsupervised: 25, 'semi-supervised': 18, supervised: 10 }
  const visitScore = d.visits.length > 0 ? visitScoreMap[d.latestVisitType] || 10 : 0
  const consistencyPct = onTrackCategories.length > 0 ? Math.round((onTrackCategories.length / categories.length) * 100) : 0
  const consistencyScore = Math.min(25, Math.round((consistencyPct / 100) * 25))
  const totalScore = drugScore + programScore + visitScore + consistencyScore
  const strengthLabel = totalScore >= 90 ? 'Excellent' : totalScore >= 70 ? 'Good' : totalScore >= 50 ? 'Fair' : 'Needs Improvement'
  const strengthColor = totalScore >= 90 ? '#059669' : totalScore >= 70 ? '#10b981' : totalScore >= 50 ? '#d97706' : '#dc2626'

  // Recommendations
  const recommendations: string[] = []
  if (d.drugPassRate >= 80 && d.cleanStreak > 0) recommendations.push('Continue maintaining clean drug test streak (' + d.cleanStreak + ' consecutive)')
  if (d.drugPassRate < 100 && d.failedTests.length > 0) recommendations.push('Address remaining drug test concerns \u2014 ' + d.failedTests.length + ' positive result(s) on record')
  const remainingCounseling = d.counselingSessions.length - d.completedSessions.length
  if (remainingCounseling > 0) recommendations.push('Complete remaining ' + remainingCounseling + ' counseling session(s)')
  if (d.completedSteps.length < 12) recommendations.push('Continue NA 12-step program \u2014 ' + (12 - d.completedSteps.length) + ' step(s) remaining')
  if (d.latestVisitType === 'supervised' && d.completedVisits.length >= 3) recommendations.push('Request semi-supervised visit evaluation')
  if (d.latestVisitType === 'semi-supervised' && d.completedVisits.length >= 6) recommendations.push('Request unsupervised visit evaluation')
  const remainingClasses = d.parentingClasses.length - d.completedClasses.length
  if (remainingClasses > 0) recommendations.push('Complete remaining ' + remainingClasses + ' parenting class(es)')
  if (d.naMeetings.length < 30 && d.naMeetings.length > 0) recommendations.push('Continue attending NA meetings \u2014 aim for 30+ documented')
  if (recommendations.length === 0) recommendations.push('All major requirements on track \u2014 continue current compliance pattern')

  // Drug test timeline
  const drugTimeline = [...d.drugTests].sort((a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime())

  // Visit progression
  const visitProgression = d.sortedCompletedVisits.slice(0, 10).reverse()

  // Status helper
  const catStatus = (pct: number) => pct >= 100 ? 'Completed' : pct >= 60 ? 'On Track' : pct >= 30 ? 'Needs Attention' : 'Behind'
  const catStatusColor = (pct: number) => pct >= 100 ? '#059669' : pct >= 60 ? '#10b981' : pct >= 30 ? '#d97706' : '#dc2626'

  const counselingPct = d.counselingSessions.length > 0 ? Math.round((d.completedSessions.length / d.counselingSessions.length) * 100) : 0
  const visitsPct = d.visits.length > 0 ? Math.round((d.completedVisits.length / d.visits.length) * 100) : 0
  const classesPct = d.parentingClasses.length > 0 ? Math.round((d.completedClasses.length / d.parentingClasses.length) * 100) : 0
  const stepsPct = Math.round((d.completedSteps.length / 12) * 100)
  const meetingsPct = d.naMeetings.length > 0 ? Math.round((d.verifiedMeetings.length / d.naMeetings.length) * 100) : 0
  const courtPct = d.courtDates.length > 0 ? Math.round((d.completedCourtDates.length / d.courtDates.length) * 100) : 0

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Court-Ready Compliance Report - Case ${d.caseNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; background: #fff; line-height: 1.6; }
    .page { max-width: 850px; margin: 0 auto; padding: 0 50px 40px; }
    /* Cover Page */
    .cover { min-height: 260px; background: linear-gradient(135deg, #064e3b 0%, #059669 60%, #10b981 100%); color: #fff; padding: 40px 50px; margin: 0 -50px; display: flex; flex-direction: column; justify-content: center; }
    .cover-brand { font-size: 13px; letter-spacing: 4px; text-transform: uppercase; opacity: 0.8; margin-bottom: 12px; }
    .cover h1 { font-size: 28px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px; }
    .cover-case { font-size: 20px; font-weight: 600; opacity: 0.9; margin-bottom: 16px; }
    .cover-meta { font-size: 12px; opacity: 0.7; display: flex; gap: 24px; flex-wrap: wrap; }
    .cover-divider { width: 60px; height: 3px; background: #fbbf24; margin: 16px 0; }
    /* Sections */
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #059669; border-bottom: 2px solid #059669; padding-bottom: 6px; margin-bottom: 14px; }
    /* Info Grid */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 28px; }
    .info-item { display: flex; gap: 8px; font-size: 12px; padding: 5px 0; border-bottom: 1px solid #f3f4f6; }
    .info-label { font-weight: 600; color: #374151; min-width: 110px; }
    .info-value { color: #1f2937; }
    /* Score Badge */
    .score-section { display: flex; align-items: center; gap: 28px; margin: 20px 0; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #bbf7d0; border-radius: 8px; }
    .score-ring { width: 100px; height: 100px; position: relative; flex-shrink: 0; }
    .score-ring svg { width: 100%; height: 100%; }
    .score-ring .score-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 24px; font-weight: 800; color: #059669; }
    .score-details h3 { font-size: 18px; font-weight: 700; color: #064e3b; margin-bottom: 4px; }
    .score-assessment { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .score-assessment.ready { background: #d1fae5; color: #065f46; }
    .score-assessment.needs-work { background: #fef3c7; color: #92400e; }
    .score-narrative { font-size: 12px; color: #374151; margin-top: 10px; line-height: 1.7; }
    /* Category Card */
    .cat-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px 16px; margin-bottom: 12px; }
    .cat-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .cat-card-title { font-size: 13px; font-weight: 700; color: #1f2937; }
    .cat-status { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 8px; border-radius: 10px; }
    .cat-bar { height: 10px; background: #e5e7eb; border-radius: 5px; overflow: hidden; margin: 6px 0; }
    .cat-bar-fill { height: 100%; border-radius: 5px; }
    .cat-detail { font-size: 11px; color: #6b7280; }
    .cat-items { margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; }
    .cat-items li { font-size: 11px; padding: 3px 0; list-style: none; display: flex; gap: 6px; }
    /* Drug Timeline */
    .timeline-row { display: flex; align-items: center; gap: 10px; padding: 5px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .timeline-dot.pass { background: #10b981; }
    .timeline-dot.fail { background: #ef4444; }
    .timeline-dot.pending { background: #d97706; }
    .streak-badge { display: inline-block; background: #d1fae5; color: #065f46; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 8px; margin-left: 4px; }
    /* Visit Progression */
    .visit-step { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; margin: 3px; }
    .visit-step.active { background: #d1fae5; color: #065f46; }
    .visit-step.inactive { background: #f3f4f6; color: #9ca3af; }
    .visit-arrow { font-size: 14px; color: #d1d5db; margin: 0 2px; }
    /* Strength Grid */
    .strength-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .strength-item { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; text-align: center; }
    .strength-score { font-size: 22px; font-weight: 800; }
    .strength-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .strength-total { grid-column: 1 / -1; background: linear-gradient(135deg, #f0fdf4, #ecfdf5); border: 2px solid #bbf7d0; padding: 14px; }
    /* Recommendations */
    .rec-item { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .rec-num { width: 22px; height: 22px; background: #059669; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    /* Verified Badge */
    .verified-badge { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; background: linear-gradient(135deg, #064e3b, #059669); color: #fff; border-radius: 8px; margin: 24px 0; }
    .verified-check { width: 24px; height: 24px; background: #fbbf24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #064e3b; font-weight: 800; }
    .verified-text { font-size: 14px; font-weight: 700; letter-spacing: 1px; }
    .verified-sub { font-size: 10px; opacity: 0.7; }
    /* Footer */
    .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #059669; text-align: center; }
    .footer p { font-size: 10px; color: #9ca3af; }
    .footer .confidential { font-weight: 700; color: #374151; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    @media print { body { padding: 0; } .page { padding: 0 30px 20px; } .cover { margin: 0 -30px; } }
  </style>
</head>
<body>
  <div class="page">
    <!-- Professional Cover Page -->
    <div class="cover">
      <div class="cover-brand">Reunify Pro</div>
      <h1>Court-Ready Compliance Report</h1>
      <div class="cover-divider"></div>
      <div class="cover-case">Case #${d.caseNumber}</div>
      <div class="cover-meta">
        <span>Court: ${caseData.courtName || 'Not specified'}</span>
        <span>Judge: ${caseData.judgeName || 'Not specified'}</span>
        <span>Generated: ${d.today}</span>
      </div>
    </div>

    <!-- Case Information -->
    <div class="section" style="margin-top:24px">
      <div class="section-title">Case Information</div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">Case Number:</span><span class="info-value">${d.caseNumber}</span></div>
        <div class="info-item"><span class="info-label">Court:</span><span class="info-value">${caseData.courtName || 'Not specified'}</span></div>
        <div class="info-item"><span class="info-label">Judge:</span><span class="info-value">${caseData.judgeName || 'Not specified'}</span></div>
        <div class="info-item"><span class="info-label">Caseworker:</span><span class="info-value">${caseData.caseworkerName || 'Not specified'}${caseData.caseworkerPhone ? ' (' + caseData.caseworkerPhone + ')' : ''}</span></div>
        <div class="info-item"><span class="info-label">Attorney:</span><span class="info-value">${caseData.attorneyName || 'Not specified'}${caseData.attorneyPhone ? ' (' + caseData.attorneyPhone + ')' : ''}</span></div>
        <div class="info-item"><span class="info-label">Removal Date:</span><span class="info-value">${d.formatDate(caseData.removalDate as string | null)}</span></div>
        <div class="info-item"><span class="info-label">Target Date:</span><span class="info-value">${d.formatDate(caseData.targetReunificationDate as string | null)}</span></div>
        <div class="info-item"><span class="info-label">Report Date:</span><span class="info-value">${d.today}</span></div>
      </div>
    </div>

    <!-- Compliance Score -->
    <div class="section">
      <div class="section-title">Compliance Score</div>
      <div class="score-section">
        <div class="score-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#d1fae5" stroke-width="8"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#059669" stroke-width="8" stroke-dasharray="${2 * Math.PI * 42}" stroke-dashoffset="${2 * Math.PI * 42 * (1 - d.overallProgress / 100)}" stroke-linecap="round" transform="rotate(-90 50 50)"/>
          </svg>
          <div class="score-text">${d.overallProgress}%</div>
        </div>
        <div class="score-details">
          <h3>${d.completedReqs.length} of ${d.requirements.length} Requirements Complete</h3>
          <span class="score-assessment ${d.overallProgress >= 70 ? 'ready' : 'needs-work'}">${d.overallProgress >= 70 ? 'Court Ready' : 'Needs Work'}</span>
          <p class="score-narrative">${narrative}</p>
        </div>
      </div>
    </div>

    <!-- Detailed Category Breakdown -->
    <div class="section">
      <div class="section-title">Detailed Category Breakdown</div>

      <!-- Counseling -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">Counseling Sessions</span>
          <span class="cat-status" style="background:${catStatusColor(counselingPct) === '#059669' ? '#d1fae5' : catStatusColor(counselingPct) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(counselingPct)}">${catStatus(counselingPct)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${counselingPct}%;background:${catStatusColor(counselingPct)}"></div></div>
        <div class="cat-detail">${d.completedSessions.length}/${d.counselingSessions.length} sessions completed (${counselingPct}%)</div>
        ${d.counselingSessions.length > 0 ? '<div class="cat-items"><ul>' + d.counselingSessions.map((s: Record<string, unknown>) => '<li>' + (s.isCompleted ? '<span style="color:#059669;font-weight:700">\u2713</span>' : '<span style="color:#d97706;font-weight:700">\u25CB</span>') + ' ' + (s.title || 'Session') + (s.date ? ' \u2013 ' + d.formatDate(s.date as string) : '') + (s.isCompleted ? ' (Completed)' : ' (Pending)') + '</li>').join('') + '</ul></div>' : ''}
      </div>

      <!-- Drug Testing -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">Drug Testing</span>
          <span class="cat-status" style="background:${catStatusColor(d.drugPassRate) === '#059669' ? '#d1fae5' : catStatusColor(d.drugPassRate) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(d.drugPassRate)}">${catStatus(d.drugPassRate)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${d.drugPassRate}%;background:${catStatusColor(d.drugPassRate)}"></div></div>
        <div class="cat-detail">${d.passedTests.length} clean / ${d.drugTests.length} total (${d.drugPassRate}% clean rate)${d.cleanStreak > 0 ? ' \u2022 ' + d.cleanStreak + ' clean streak' : ''}${d.failedTests.length > 0 ? ' \u2022 ' + d.failedTests.length + ' positive' : ''}</div>
      </div>

      <!-- 12 Steps -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">NA 12-Step Program</span>
          <span class="cat-status" style="background:${catStatusColor(stepsPct) === '#059669' ? '#d1fae5' : catStatusColor(stepsPct) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(stepsPct)}">${catStatus(stepsPct)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${stepsPct}%;background:${catStatusColor(stepsPct)}"></div></div>
        <div class="cat-detail">${d.completedSteps.length}/12 steps completed${d.sponsorVerifiedCount > 0 ? ' \u2022 ' + d.sponsorVerifiedCount + ' sponsor-verified' : ''}</div>
        ${d.naSteps.length > 0 ? '<div class="cat-items"><ul>' + d.naSteps.map((s: Record<string, unknown>) => '<li>' + (s.isCompleted ? '<span style="color:#059669;font-weight:700">\u2713</span>' : '<span style="color:#d97706;font-weight:700">\u25CB</span>') + ' Step ' + s.stepNumber + (s.sponsorVerified ? ' (Sponsor Verified' + (s.sponsorName ? ': ' + s.sponsorName : '') + ')' : '') + (s.completedAt ? ' \u2013 ' + d.formatDate(s.completedAt as string) : '') + '</li>').join('') + '</ul></div>' : ''}
      </div>

      <!-- NA Meetings -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">NA Meetings</span>
          <span class="cat-status" style="background:${catStatusColor(meetingsPct) === '#059669' ? '#d1fae5' : catStatusColor(meetingsPct) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(meetingsPct)}">${catStatus(meetingsPct)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${meetingsPct}%;background:${catStatusColor(meetingsPct)}"></div></div>
        <div class="cat-detail">${d.naMeetings.length} attended, ${d.verifiedMeetings.length} verified (${meetingsPct}%)</div>
      </div>

      <!-- Visits -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">Supervised Visits</span>
          <span class="cat-status" style="background:${catStatusColor(visitsPct) === '#059669' ? '#d1fae5' : catStatusColor(visitsPct) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(visitsPct)}">${catStatus(visitsPct)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${visitsPct}%;background:${catStatusColor(visitsPct)}"></div></div>
        <div class="cat-detail">${d.completedVisits.length}/${d.visits.length} completed \u2022 Current Level: ${d.visitLevelLabel}</div>
      </div>

      <!-- Parenting Classes -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">Parenting Classes</span>
          <span class="cat-status" style="background:${catStatusColor(classesPct) === '#059669' ? '#d1fae5' : catStatusColor(classesPct) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(classesPct)}">${catStatus(classesPct)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${classesPct}%;background:${catStatusColor(classesPct)}"></div></div>
        <div class="cat-detail">${d.completedClasses.length}/${d.parentingClasses.length} completed \u2022 ${d.certificatesEarned} certificate(s) earned</div>
      </div>

      <!-- Court Dates -->
      <div class="cat-card">
        <div class="cat-card-header">
          <span class="cat-card-title">Court Dates</span>
          <span class="cat-status" style="background:${catStatusColor(courtPct) === '#059669' ? '#d1fae5' : catStatusColor(courtPct) === '#d97706' ? '#fef3c7' : '#fee2e2'};color:${catStatusColor(courtPct)}">${catStatus(courtPct)}</span>
        </div>
        <div class="cat-bar"><div class="cat-bar-fill" style="width:${courtPct}%;background:${catStatusColor(courtPct)}"></div></div>
        <div class="cat-detail">${d.completedCourtDates.length}/${d.courtDates.length} completed${d.nextCourtDate ? ' \u2022 Next: ' + d.formatDate(d.nextCourtDate.date as string) : ''}</div>
      </div>
    </div>

    <!-- Drug Test Timeline -->
    ${drugTimeline.length > 0 ? `
    <div class="section">
      <div class="section-title">Drug Test Timeline</div>
      ${drugTimeline.map((t: Record<string, unknown>) => {
        const isPass = t.result === 'negative'
        const isFail = t.result === 'positive'
        const isPending = !isPass && !isFail
        return '<div class="timeline-row">' +
          '<div class="timeline-dot ' + (isPass ? 'pass' : isFail ? 'fail' : 'pending') + '"></div>' +
          '<span style="font-weight:600;min-width:80px">' + (t.date ? d.formatDate(t.date as string) : '\u2014') + '</span>' +
          '<span style="color:' + (isPass ? '#059669' : isFail ? '#dc2626' : '#d97706') + ';font-weight:600">' + (isPass ? 'CLEAN' : isFail ? 'POSITIVE' : 'PENDING') + '</span>' +
          (t.type ? '<span style="color:#6b7280">' + t.type + '</span>' : '') +
          '</div>'
      }).join('')}
      ${d.cleanStreak > 0 ? '<div style="margin-top:8px;font-size:12px;color:#059669;font-weight:700">\u2713 Current Clean Streak: ' + d.cleanStreak + ' test(s)</div>' : ''}
    </div>` : ''}

    <!-- Visit Progression -->
    ${d.visits.length > 0 ? `
    <div class="section">
      <div class="section-title">Visit Progression</div>
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin:12px 0">
        <span class="visit-step ${d.latestVisitType === 'supervised' || d.latestVisitType === 'semi-supervised' || d.latestVisitType === 'unsupervised' ? 'active' : 'inactive'}">Supervised</span>
        <span class="visit-arrow">\u2192</span>
        <span class="visit-step ${d.latestVisitType === 'semi-supervised' || d.latestVisitType === 'unsupervised' ? 'active' : 'inactive'}">Semi-Supervised</span>
        <span class="visit-arrow">\u2192</span>
        <span class="visit-step ${d.latestVisitType === 'unsupervised' ? 'active' : 'inactive'}">Unsupervised</span>
      </div>
      ${visitProgression.length > 0 ? '<div style="margin-top:8px">' + visitProgression.map((v: Record<string, unknown>) =>
        '<div class="timeline-row">' +
        '<div class="timeline-dot pass"></div>' +
        '<span style="font-weight:600;min-width:80px">' + (v.date ? d.formatDate(v.date as string) : '\u2014') + '</span>' +
        '<span>' + (v.visitType || 'Supervised') + '</span>' +
        '</div>'
      ).join('') + '</div>' : ''}
    </div>` : ''}

    <!-- Case Strength Assessment -->
    <div class="section">
      <div class="section-title">Case Strength Assessment</div>
      <div class="strength-grid">
        <div class="strength-item">
          <div class="strength-score" style="color:#059669">${drugScore}/25</div>
          <div class="strength-label">Drug Compliance</div>
        </div>
        <div class="strength-item">
          <div class="strength-score" style="color:#059669">${programScore}/25</div>
          <div class="strength-label">Program Completion</div>
        </div>
        <div class="strength-item">
          <div class="strength-score" style="color:#059669">${visitScore}/25</div>
          <div class="strength-label">Visit Progression</div>
        </div>
        <div class="strength-item">
          <div class="strength-score" style="color:#059669">${consistencyScore}/25</div>
          <div class="strength-label">Consistency</div>
        </div>
        <div class="strength-item strength-total">
          <div class="strength-score" style="color:${strengthColor};font-size:28px">${totalScore}/100</div>
          <div class="strength-label" style="font-size:12px;color:${strengthColor};font-weight:700">${strengthLabel}</div>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="section">
      <div class="section-title">Recommendations</div>
      ${recommendations.map((rec, i) => '<div class="rec-item"><div class="rec-num">' + (i + 1) + '</div><div>' + rec + '</div></div>').join('')}
    </div>

    <!-- Verified Badge -->
    <div class="verified-badge">
      <div class="verified-check">\u2713</div>
      <div>
        <div class="verified-text">Verified by Reunify Pro</div>
        <div class="verified-sub">Verification ID: ${verifyId} \u2022 Verified on ${d.today}</div>
      </div>
    </div>

    <!-- Professional Footer -->
    <div class="footer">
      <div class="confidential">Confidential \u2014 Privileged Information</div>
      <p>Report ID: ${reportId} \u2022 Verification: ${verifyId}</p>
      <p>This report was generated by Reunify Pro and has been verified for accuracy against recorded case data.</p>
      <p style="margin-top:6px;font-style:italic">CONFIDENTIAL: This report contains sensitive case information protected by law. Store securely and share only with authorized parties such as your attorney, caseworker, or judge. Unauthorized distribution is prohibited. All data is stored locally on the user's device and is not transmitted to any external servers.</p>
    </div>
  </div>
</body>
</html>`

  writePdfToWindow(html)
}

export function ProgressView() {
  const { activeCaseId } = useAppStore()
  const { data: caseData, isLoading } = useCase(activeCaseId)
  const [exporting, setExporting] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const { isPro: isProUser } = useProFeature('court-reports')
  async function handleExport() {
    if (!activeCaseId) return
    try {
      setExporting(true)
      const dbData = await exportAllData()
      const activeCase = dbData.cases.find(c => c.id === activeCaseId)
      const data = {
        exportDate: dbData.exportedAt,
        exportType: 'reunify-full',
        case: activeCase || {},
        requirements: dbData.requirements.filter(r => r.caseId === activeCaseId),
        counselingSessions: dbData.counselingSessions.filter(s => s.caseId === activeCaseId),
        drugTests: dbData.drugTests.filter(t => t.caseId === activeCaseId),
        naSteps: dbData.naSteps.filter(s => s.caseId === activeCaseId),
        naMeetings: dbData.naMeetings.filter(m => m.caseId === activeCaseId),
        supervisedVisits: dbData.supervisedVisits.filter(v => v.caseId === activeCaseId),
        courtDates: dbData.courtDates.filter(d => d.caseId === activeCaseId),
        parentingClasses: dbData.parentingClasses.filter(c => c.caseId === activeCaseId),
        milestones: dbData.milestones.filter(m => m.caseId === activeCaseId),
        dailyCheckIns: dbData.dailyCheckIns.filter(c => c.caseId === activeCaseId),
        summary: {},
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reunify-export-${(data.case as Record<string, unknown>).caseNumber || 'case'}-${new Date().toISOString().split('T')[0]}.json`
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
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Overall Progress */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background overflow-hidden">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col items-center gap-4 sm:gap-6 sm:flex-row sm:items-center sm:justify-center">
            <div className="w-[130px] h-[130px] sm:w-[180px] sm:h-[180px] shrink-0">
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
                  onClick={() => setSummaryOpen(true)}
                >
                  <ClipboardCheck className="size-4" />
                  View Summary
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (caseData) {
                      generateBasicPDF(caseData as unknown as Record<string, unknown>, categories)
                    }
                  }}
                >
                  <FileText className="size-4" />
                  PDF Report
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

      {/* Charts */}
      <div>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-h-[200px] sm:max-h-[300px] mx-auto">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full h-full">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis
                    dataKey="category"
                    tick={{ fontSize: 9 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fontSize: 9 }}
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
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <ChartContainer config={chartConfig} className="aspect-video w-full">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={80}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Progress']}
                  />
                  <Bar dataKey="progress" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
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
            {/* Court Ready Report - Pro only */}
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              onClick={() => {
                if (isProUser) {
                  if (caseData) {
                    generateCourtReadyPDF(caseData as unknown as Record<string, unknown>, categories, true)
                  }
                } else {
                  window.dispatchEvent(new CustomEvent('reunify-show-upgrade', { detail: { feature: 'court-reports' } }))
                }
              }}
            >
              <Crown className="size-4" />
              Court Ready
              {isProUser && <ProBadge size="sm" className="ml-1" />}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                if (caseData) {
                  generateBasicPDF(caseData as unknown as Record<string, unknown>, categories)
                }
              }}
            >
              <FileText className="size-4" />
              PDF Report
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-0.5">Pro</span>
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={() => setSummaryOpen(true)}
            >
              <ClipboardCheck className="size-4" />
              Summary
            </Button>
            <Button
              className="gap-2"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {exporting ? 'Exporting...' : 'Export Case Data'}
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

export default ProgressView
