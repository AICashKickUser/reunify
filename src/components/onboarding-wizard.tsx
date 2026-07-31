'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCreateCase, useCreateItem, useSeedDatabase } from '@/lib/data-hooks'
import { useAppStore } from '@/lib/store'
import { getLocalAutoBackup } from '@/hooks/use-auto-backup'
import { importAllData, exportAllData } from '@/lib/client-db'
import {
  Loader2,
  CalendarIcon,
  ArrowRight,
  ArrowLeft,
  Pill,
  MessageCircle,
  Footprints,
  Baby,
  GraduationCap,
  ClipboardList,
  CalendarDays,
  FileText,
  Eye,
  Heart,
  Star,
  CheckCircle2,
  Gavel,
  FlaskConical,
  User,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ONBOARDING_COMPLETE_KEY = 'reunify-onboarding-complete'

// ─── Requirement Card Definitions ────────────────────────────────────────────

interface RequirementOption {
  id: string
  emoji: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  category: string
  defaultTitle: string
  frequency: string
  preselected: boolean
}

const REQUIREMENT_OPTIONS: RequirementOption[] = [
  {
    id: 'drug-testing',
    emoji: '💊',
    icon: Pill,
    title: 'Drug Testing',
    category: 'drug-testing',
    defaultTitle: 'Complete random drug testing',
    frequency: 'as-needed',
    preselected: true,
  },
  {
    id: 'counseling',
    emoji: '💬',
    icon: MessageCircle,
    title: 'Counseling / Therapy',
    category: 'counseling',
    defaultTitle: 'Attend individual counseling sessions',
    frequency: 'weekly',
    preselected: true,
  },
  {
    id: 'na-meetings',
    emoji: '🦶',
    icon: Footprints,
    title: 'NA/AA Meetings & 12 Steps',
    category: 'na-meetings',
    defaultTitle: 'Attend NA/AA meetings (3x per week minimum)',
    frequency: 'weekly',
    preselected: true,
  },
  {
    id: 'supervised-visits',
    emoji: '👶',
    icon: Baby,
    title: 'Supervised Visits',
    category: 'supervised-visits',
    defaultTitle: 'Attend supervised visits (2x per week)',
    frequency: 'weekly',
    preselected: false,
  },
  {
    id: 'parenting-classes',
    emoji: '🎓',
    icon: GraduationCap,
    title: 'Parenting Classes',
    category: 'parenting-classes',
    defaultTitle: 'Complete parenting classes',
    frequency: 'one-time',
    preselected: false,
  },
  {
    id: 'case-plan',
    emoji: '📋',
    icon: ClipboardList,
    title: 'Case Plan Requirements',
    category: 'other',
    defaultTitle: 'Complete all case plan requirements',
    frequency: 'as-needed',
    preselected: false,
  },
  {
    id: 'court-dates',
    emoji: '📅',
    icon: CalendarDays,
    title: 'Court Dates',
    category: 'legal',
    defaultTitle: 'Attend all court hearings',
    frequency: 'as-needed',
    preselected: false,
  },
  {
    id: 'daily-checkins',
    emoji: '📝',
    icon: FileText,
    title: 'Daily Check-ins',
    category: 'other',
    defaultTitle: 'Complete daily check-ins',
    frequency: 'daily',
    preselected: false,
  },
]

// ─── Reminder Types ──────────────────────────────────────────────────────────

type ReminderType = 'court-date' | 'drug-test' | 'counseling' | null

interface ReminderForm {
  courtDate: { date: Date | undefined; hearingType: string }
  drugTest: { date: Date | undefined; testType: string }
  counseling: { date: Date | undefined; counselorName: string }
}

// ─── Confetti Piece ──────────────────────────────────────────────────────────

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => {
    const colors = [
      'bg-emerald-400',
      'bg-emerald-500',
      'bg-amber-400',
      'bg-amber-500',
      'bg-rose-400',
      'bg-sky-400',
      'bg-violet-400',
      'bg-teal-400',
    ]
    const color = colors[i % colors.length]
    const left = Math.random() * 100
    const delay = Math.random() * 2
    const duration = 2 + Math.random() * 2
    const size = 4 + Math.random() * 6
    const rotation = Math.random() * 360
    const isCircle = Math.random() > 0.5

    return (
      <span
        key={i}
        className={cn('absolute top-0 opacity-0', color, isCircle ? 'rounded-full' : 'rounded-sm')}
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          animation: `confetti-fall ${duration}s ${delay}s ease-out forwards`,
          transform: `rotate(${rotation}deg)`,
        }}
      />
    )
  })

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes confetti-fall {
              0% {
                opacity: 1;
                transform: translateY(-20px) rotate(0deg) scale(1);
              }
              50% {
                opacity: 1;
              }
              100% {
                opacity: 0;
                transform: translateY(calc(100vh + 40px)) rotate(720deg) scale(0.5);
              }
            }
          `,
        }}
      />
    </div>
  )
}

// ─── Progress Indicator ──────────────────────────────────────────────────────

function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              'flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
              i < currentStep
                ? 'bg-emerald-600 text-white'
                : i === currentStep
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-200 ring-offset-2'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {i < currentStep ? (
              <CheckCircle2 className="size-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={cn(
                'h-0.5 w-6 sm:w-10 transition-colors duration-300',
                i < currentStep ? 'bg-emerald-500' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Case Info ───────────────────────────────────────────────────────

function StepCaseInfo({
  caseNumber,
  setCaseNumber,
  courtName,
  setCourtName,
  removalDate,
  setRemovalDate,
  targetReunificationDate,
  setTargetReunificationDate,
  onNext,
}: {
  caseNumber: string
  setCaseNumber: (v: string) => void
  courtName: string
  setCourtName: (v: string) => void
  removalDate: Date | undefined
  setRemovalDate: (v: Date | undefined) => void
  targetReunificationDate: Date | undefined
  setTargetReunificationDate: (v: Date | undefined) => void
  onNext: () => void
}) {
  const [removalDateOpen, setRemovalDateOpen] = useState(false)
  const [targetDateOpen, setTargetDateOpen] = useState(false)

  const canProceed = caseNumber.trim().length > 0

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <FileText className="size-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Let&apos;s set up your case</h2>
        <p className="text-muted-foreground text-sm">
          Enter your case details below. You can always update these later.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wiz-case-number">
            Case Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="wiz-case-number"
            placeholder="e.g., CPS-2024-0847"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wiz-court-name">Court / County</Label>
          <Input
            id="wiz-court-name"
            placeholder="e.g., Harris County Family Court"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Removal Date (optional)</Label>
            <Popover open={removalDateOpen} onOpenChange={setRemovalDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-12',
                    !removalDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="size-4 mr-2" />
                  {removalDate ? format(removalDate, 'MMM d, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={removalDate}
                  onSelect={(date) => {
                    setRemovalDate(date)
                    setRemovalDateOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Target Reunification Date (optional)</Label>
            <Popover open={targetDateOpen} onOpenChange={setTargetDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-12',
                    !targetReunificationDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="size-4 mr-2" />
                  {targetReunificationDate ? format(targetReunificationDate, 'MMM d, yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={targetReunificationDate}
                  onSelect={(date) => {
                    setTargetReunificationDate(date)
                    setTargetDateOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
        onClick={onNext}
        disabled={!canProceed}
      >
        Next
        <ArrowRight className="size-4 ml-1" />
      </Button>
    </div>
  )
}

// ─── Step 2: Requirements ────────────────────────────────────────────────────

function StepRequirements({
  selectedRequirements,
  toggleRequirement,
  onNext,
  onBack,
}: {
  selectedRequirements: Set<string>
  toggleRequirement: (id: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <ClipboardList className="size-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">What are your requirements?</h2>
        <p className="text-muted-foreground text-sm">Select all that apply to your case plan</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {REQUIREMENT_OPTIONS.map((req) => {
          const isSelected = selectedRequirements.has(req.id)
          const Icon = req.icon
          return (
            <button
              key={req.id}
              type="button"
              onClick={() => toggleRequirement(req.id)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 text-center min-h-[100px] justify-center',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                  : 'border-muted bg-background hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
              )}
            >
              <span className="text-2xl" role="img" aria-label={req.title}>
                {req.emoji}
              </span>
              <div className="flex items-center gap-1.5">
                {isSelected && <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />}
                <span
                  className={cn(
                    'text-xs font-medium leading-tight',
                    isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
                  )}
                >
                  {req.title}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1"
          onClick={onBack}
        >
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
          onClick={onNext}
        >
          Next
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: First Reminder ──────────────────────────────────────────────────

function StepReminders({
  reminderForm,
  setReminderForm,
  activeReminder,
  setActiveReminder,
  onNext,
  onBack,
}: {
  reminderForm: ReminderForm
  setReminderForm: React.Dispatch<React.SetStateAction<ReminderForm>>
  activeReminder: ReminderType
  setActiveReminder: (v: ReminderType) => void
  onNext: () => void
  onBack: () => void
}) {
  const [courtDateOpen, setCourtDateOpen] = useState(false)
  const [drugTestDateOpen, setDrugTestDateOpen] = useState(false)
  const [counselingDateOpen, setCounselingDateOpen] = useState(false)

  const reminderOptions: { type: ReminderType; icon: React.ComponentType<{ className?: string }>; label: string; emoji: string }[] = [
    { type: 'court-date', icon: Gavel, label: 'Add Court Date', emoji: '⚖️' },
    { type: 'drug-test', icon: FlaskConical, label: 'Add Drug Test', emoji: '💊' },
    { type: 'counseling', icon: User, label: 'Add Counseling Session', emoji: '💬' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <CalendarDays className="size-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Set up your first reminder</h2>
        <p className="text-muted-foreground text-sm">
          Get a head start by adding your first upcoming event
        </p>
      </div>

      {/* Quick-add option buttons */}
      <div className="space-y-3">
        {reminderOptions.map((opt) => {
          const Icon = opt.icon
          const isActive = activeReminder === opt.type
          return (
            <div key={opt.type} className="space-y-3">
              <button
                type="button"
                onClick={() => setActiveReminder(isActive ? null : opt.type)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200',
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-muted bg-background hover:border-emerald-200 dark:hover:border-emerald-800'
                )}
              >
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg',
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-900/50'
                      : 'bg-muted'
                  )}
                >
                  <Icon className={cn('size-5', isActive ? 'text-emerald-600' : 'text-muted-foreground')} />
                </div>
                <span className={cn('text-sm font-medium', isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>
                  {opt.label}
                </span>
                {isActive && <CheckCircle2 className="size-4 text-emerald-600 ml-auto" />}
              </button>

              {/* Expanded form for the active reminder */}
              {isActive && opt.type === 'court-date' && (
                <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Hearing Date</Label>
                      <Popover open={courtDateOpen} onOpenChange={setCourtDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal h-11',
                              !reminderForm.courtDate.date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="size-4 mr-2" />
                            {reminderForm.courtDate.date
                              ? format(reminderForm.courtDate.date, 'MMM d, yyyy')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={reminderForm.courtDate.date}
                            onSelect={(date) => {
                              setReminderForm((prev) => ({
                                ...prev,
                                courtDate: { ...prev.courtDate, date: date ?? undefined },
                              }))
                              setCourtDateOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Hearing Type</Label>
                      <Input
                        placeholder="e.g., Status Hearing, Permanency Review"
                        value={reminderForm.courtDate.hearingType}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            courtDate: { ...prev.courtDate, hearingType: e.target.value },
                          }))
                        }
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {isActive && opt.type === 'drug-test' && (
                <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Test Date</Label>
                      <Popover open={drugTestDateOpen} onOpenChange={setDrugTestDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal h-11',
                              !reminderForm.drugTest.date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="size-4 mr-2" />
                            {reminderForm.drugTest.date
                              ? format(reminderForm.drugTest.date, 'MMM d, yyyy')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={reminderForm.drugTest.date}
                            onSelect={(date) => {
                              setReminderForm((prev) => ({
                                ...prev,
                                drugTest: { ...prev.drugTest, date: date ?? undefined },
                              }))
                              setDrugTestDateOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Test Type</Label>
                      <Input
                        placeholder="e.g., UA, Hair Follicle, Blood"
                        value={reminderForm.drugTest.testType}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            drugTest: { ...prev.drugTest, testType: e.target.value },
                          }))
                        }
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {isActive && opt.type === 'counseling' && (
                <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Session Date</Label>
                      <Popover open={counselingDateOpen} onOpenChange={setCounselingDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal h-11',
                              !reminderForm.counseling.date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="size-4 mr-2" />
                            {reminderForm.counseling.date
                              ? format(reminderForm.counseling.date, 'MMM d, yyyy')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={reminderForm.counseling.date}
                            onSelect={(date) => {
                              setReminderForm((prev) => ({
                                ...prev,
                                counseling: { ...prev.counseling, date: date ?? undefined },
                              }))
                              setCounselingDateOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Therapist / Counselor Name</Label>
                      <Input
                        placeholder="e.g., Dr. Maria Santos"
                        value={reminderForm.counseling.counselorName}
                        onChange={(e) =>
                          setReminderForm((prev) => ({
                            ...prev,
                            counseling: { ...prev.counseling, counselorName: e.target.value },
                          }))
                        }
                        className="h-11"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-12 flex-1"
          onClick={onBack}
        >
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
          onClick={onNext}
        >
          Next
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  )
}

// ─── Step 4: Motivational Finish ─────────────────────────────────────────────

function StepFinish({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 overflow-hidden">
      <Confetti />

      <div className="relative z-10 space-y-6">
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
            <Heart className="size-10 text-white" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center gap-1">
            <Star className="size-5 text-amber-500" />
            <Star className="size-6 text-amber-500" />
            <Star className="size-5 text-amber-500" />
          </div>

          <h2 className="text-3xl font-bold text-foreground">
            Your journey starts now.
          </h2>
          <p className="text-lg text-emerald-600 dark:text-emerald-400 font-medium">
            Every step brings you closer to your kids.
          </p>
        </div>

        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/20 max-w-xs mx-auto">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                You&apos;re already ahead of most — just by showing up.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 text-lg px-8 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
          onClick={onGoToDashboard}
          size="lg"
        >
          Go to Dashboard
          <ArrowRight className="size-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// ─── Explore Demo Card ───────────────────────────────────────────────────────

function ExploreDemoCard() {
  const seedMutation = useSeedDatabase()
  const { setActiveCaseId } = useAppStore()

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Load a sample case with realistic data to explore how Reunify works — this is not real data.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full h-11"
          onClick={() => {
            seedMutation.mutate(undefined, {
              onSuccess: (data) => {
                // Set the active case ID so the app navigates to the dashboard
                if (data?.caseId) {
                  setActiveCaseId(data.caseId)
                }
              },
            })
          }}
          disabled={seedMutation.isPending}
        >
          {seedMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Eye className="size-4" />
          )}
          {seedMutation.isPending ? 'Loading Demo Case...' : 'Explore with Demo Data'}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Onboarding Wizard ──────────────────────────────────────────────────

export function OnboardingWizard() {
  const { setActiveCaseId } = useAppStore()
  const createCase = useCreateCase()
  const createRequirement = useCreateItem('requirements')
  const createCourtDate = useCreateItem('court-dates')
  const createDrugTest = useCreateItem('drug-tests')
  const createCounseling = useCreateItem('counseling')

  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [isRestoring, setIsRestoring] = useState(false)

  // Check for local auto-backup on mount
  const localBackup = typeof window !== 'undefined' ? getLocalAutoBackup() : null
  const hasRecoverableData = !!localBackup && (localBackup.data as { cases?: unknown[] })?.cases && ((localBackup.data as { cases: unknown[] }).cases.length > 0)

  // Handle recovery from local auto-backup
  const handleRecoverData = useCallback(async () => {
    if (!localBackup) return
    setIsRestoring(true)
    try {
      const backupData = localBackup.data as Parameters<typeof importAllData>[0]
      await importAllData(backupData)
      // Set the first case as active
      if (backupData.cases && backupData.cases.length > 0) {
        const firstCase = backupData.cases[0] as { id: string }
        setActiveCaseId(firstCase.id)
      }
      toast.success('Data recovered!', {
        description: 'Your saved data has been restored from the auto-backup.',
      })
    } catch {
      toast.error('Recovery failed', {
        description: 'Could not restore your data. Please try restoring from a backup file.',
      })
    } finally {
      setIsRestoring(false)
    }
  }, [localBackup, setActiveCaseId])

  // Step 1 state
  const [caseNumber, setCaseNumber] = useState('')
  const [courtName, setCourtName] = useState('')
  const [removalDate, setRemovalDate] = useState<Date | undefined>(undefined)
  const [targetReunificationDate, setTargetReunificationDate] = useState<Date | undefined>(undefined)

  // Step 2 state — pre-select common ones
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    REQUIREMENT_OPTIONS.filter((r) => r.preselected).forEach((r) => initial.add(r.id))
    return initial
  })

  // Step 3 state
  const [activeReminder, setActiveReminder] = useState<ReminderType>(null)
  const [reminderForm, setReminderForm] = useState<ReminderForm>({
    courtDate: { date: undefined, hearingType: '' },
    drugTest: { date: undefined, testType: '' },
    counseling: { date: undefined, counselorName: '' },
  })

  const toggleRequirement = useCallback((id: string) => {
    setSelectedRequirements((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const goNext = useCallback(() => {
    setDirection('forward')
    setStep((s) => s + 1)
  }, [])

  const goBack = useCallback(() => {
    setDirection('backward')
    setStep((s) => s - 1)
  }, [])

  // Handle final submission: create case, requirements, and reminders
  const handleFinish = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // 1. Create the case
      const caseData = await createCase.mutateAsync({
        caseNumber: caseNumber.trim(),
        courtName: courtName.trim() || null,
        caseworkerName: null,
        caseworkerPhone: null,
        judgeName: null,
        attorneyName: null,
        attorneyPhone: null,
        removalDate: removalDate ? removalDate.toISOString() : null,
        targetReunificationDate: targetReunificationDate ? targetReunificationDate.toISOString() : null,
        caseStatus: 'active',
        notes: null,
      })

      const caseId = caseData.id
      setActiveCaseId(caseId)

      // 2. Create requirements from selected cards
      const selectedReqs = REQUIREMENT_OPTIONS.filter((r) => selectedRequirements.has(r.id))
      if (selectedReqs.length > 0) {
        const reqPromises = selectedReqs.map((req, index) =>
          createRequirement.mutateAsync({
            caseId,
            category: req.category,
            title: req.defaultTitle,
            frequency: req.frequency,
            isCompleted: false,
            sortOrder: index + 1,
          })
        )
        await Promise.all(reqPromises)
      }

      // 3. Create reminders if any were filled out
      const reminderPromises: Promise<unknown>[] = []

      if (activeReminder === 'court-date' && reminderForm.courtDate.date) {
        reminderPromises.push(
          createCourtDate.mutateAsync({
            caseId,
            date: reminderForm.courtDate.date.toISOString(),
            hearingType: reminderForm.courtDate.hearingType.trim() || null,
            isCompleted: false,
          })
        )
      }

      if (activeReminder === 'drug-test' && reminderForm.drugTest.date) {
        reminderPromises.push(
          createDrugTest.mutateAsync({
            caseId,
            date: reminderForm.drugTest.date.toISOString(),
            testType: reminderForm.drugTest.testType.trim() || null,
            isRandom: false,
            callMade: false,
            tested: false,
          })
        )
      }

      if (activeReminder === 'counseling' && reminderForm.counseling.date) {
        reminderPromises.push(
          createCounseling.mutateAsync({
            caseId,
            date: reminderForm.counseling.date.toISOString(),
            counselorName: reminderForm.counseling.counselorName.trim() || null,
            isCompleted: false,
          })
        )
      }

      if (reminderPromises.length > 0) {
        await Promise.all(reminderPromises)
      }

      // 4. Mark onboarding as complete
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')

      toast.success('Case created successfully! Your journey begins now.')
    } catch {
      toast.error('Failed to create case. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    isSubmitting,
    caseNumber,
    courtName,
    removalDate,
    targetReunificationDate,
    selectedRequirements,
    activeReminder,
    reminderForm,
    createCase,
    createRequirement,
    createCourtDate,
    createDrugTest,
    createCounseling,
    setActiveCaseId,
  ])

  const handleGoToDashboard = useCallback(() => {
    // Navigate to step 3 (finish) which triggers the submit
    // Actually, the finish step already shows after submit, so just go to dashboard
    // The activeCaseId is already set
  }, [])

  // Check if user has already completed onboarding
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasCompletedOnboarding(!!localStorage.getItem(ONBOARDING_COMPLETE_KEY))
    }
  }, [])

  // If onboarding was already completed, show a simple welcome
  // If there's recoverable data, offer to restore it
  if (hasCompletedOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
              <Heart className="size-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Welcome to Reunify</h2>
            <p className="text-muted-foreground">
              Track your CPS reunification case plan progress. Stay organized, stay focused, and bring your kids home.
            </p>
          </div>

          {/* Data Recovery Prompt */}
          {hasRecoverableData && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20 text-left">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    We found your saved data!
                  </p>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  An auto-backup from {localBackup ? new Date(localBackup.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'a previous session'} was found. Would you like to restore it?
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={handleRecoverData}
                    disabled={isRestoring}
                  >
                    {isRestoring ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    {isRestoring ? 'Restoring...' : 'Restore My Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ExploreDemoCard />
        </div>
      </div>
    )
  }

  // Loading overlay during submission
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
        <Loader2 className="size-10 animate-spin text-emerald-600" />
        <p className="text-muted-foreground text-sm">Setting up your case...</p>
      </div>
    )
  }

  const TOTAL_STEPS = 3 // Steps 1-3 have progress; step 4 is the finish

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 min-h-[70vh]">
      <div className="w-full max-w-md">
        {/* Progress indicator (hidden on finish step) */}
        {step < 3 && <ProgressIndicator currentStep={step} totalSteps={TOTAL_STEPS} />}

        {/* Step content with slide animation */}
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            opacity: 1,
            transform: 'translateX(0)',
          }}
        >
          {step === 0 && (
            <StepCaseInfo
              caseNumber={caseNumber}
              setCaseNumber={setCaseNumber}
              courtName={courtName}
              setCourtName={setCourtName}
              removalDate={removalDate}
              setRemovalDate={setRemovalDate}
              targetReunificationDate={targetReunificationDate}
              setTargetReunificationDate={setTargetReunificationDate}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <StepRequirements
              selectedRequirements={selectedRequirements}
              toggleRequirement={toggleRequirement}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <StepReminders
              reminderForm={reminderForm}
              setReminderForm={setReminderForm}
              activeReminder={activeReminder}
              setActiveReminder={setActiveReminder}
              onNext={async () => {
                await handleFinish()
                goNext()
              }}
              onBack={goBack}
            />
          )}
          {step === 3 && <StepFinish onGoToDashboard={handleGoToDashboard} />}
        </div>

        {/* Explore demo option (only on step 0) */}
        {step === 0 && (
          <div className="mt-6">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground/70">Just exploring?</span>
              </div>
            </div>
            <ExploreDemoCard />
          </div>
        )}
      </div>
    </div>
  )
}
