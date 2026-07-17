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
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useCase } from '@/lib/data-hooks'
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
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
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
        <span className="text-4xl font-bold text-foreground">{value}%</span>
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

export function ProgressView() {
  const { activeCaseId } = useAppStore()
  const { data: caseData, isLoading } = useCase(activeCaseId)
  const [exporting, setExporting] = useState(false)

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
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center">
            <CircularProgress value={overallProgress} />
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
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
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
              className="gap-2"
              onClick={handleExport}
              disabled={exporting || !activeCaseId}
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
              Print Report
            </Button>
          </div>
        </div>
        <PrivacyNotice />
      </div>
    </div>
  )
}
