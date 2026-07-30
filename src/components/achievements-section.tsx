'use client'

import { useMemo, useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import {
  calculateCleanStreak,
  calculateMeetingStreak,
  calculateCounselingRate,
  calculateOverallProgress,
  getMilestones,
  MOTIVATIONAL_QUOTES,
  type Achievement,
  type CleanStreakResult,
  type MeetingStreakResult,
  type CounselingRateResult,
  type OverallProgressResult,
} from '@/lib/streaks'
import type { DrugTest, NAMeeting, CounselingSession, CaseInfo, CaseRequirement, NAStep } from '@/lib/types'
import { useCelebration } from '@/components/celebration'
import {
  Users,
  MessageSquareHeart,
  Star,
  Trophy,
  ChevronRight,
  Quote,
} from 'lucide-react'

interface AchievementsSectionProps {
  caseData: CaseInfo & {
    requirements: CaseRequirement[]
    counselingSessions: CounselingSession[]
    drugTests: DrugTest[]
    naSteps: NAStep[]
    naMeetings: NAMeeting[]
  }
}

// --- Individual Achievement Card ---
function AchievementCard({
  icon,
  emoji,
  label,
  value,
  subtitle,
  progress,
  progressLabel,
  colorClass,
  onClick,
  badge,
}: {
  icon?: React.ReactNode
  emoji?: string
  label: string
  value: string | number
  subtitle: string
  progress?: number
  progressLabel?: string
  colorClass: string
  onClick?: () => void
  badge?: string
}) {
  return (
    <Card
      className="relative overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`} />
      <CardContent className="p-3 sm:p-4 pl-4 sm:pl-5">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex size-9 sm:size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30 shrink-0 text-lg sm:text-xl">
            {emoji || icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </p>
              {badge && (
                <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 shrink-0">
                  {badge}
                </Badge>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">{subtitle}</span>
            </div>
            {progress !== undefined && (
              <div className="mt-1.5 space-y-0.5">
                <Progress value={progress} className="h-2" />
                {progressLabel && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{progressLabel}</p>
                )}
              </div>
            )}
          </div>
          <ChevronRight className="size-4 text-muted-foreground/40 shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  )
}

// --- Achievement Badge Row ---
function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  const achieved = achievements.filter((a) => a.achieved)
  if (achieved.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {achieved.map((a) => (
        <span
          key={a.id}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-transform hover:scale-105"
          title={a.description}
        >
          <span className="text-sm">{a.emoji}</span>
          <span className="hidden sm:inline">{a.title}</span>
        </span>
      ))}
    </div>
  )
}

// --- Motivational Quote ---
function MotivationalQuote() {
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const quote = MOTIVATIONAL_QUOTES[quoteIndex]

  return (
    <div className="flex items-start gap-2 sm:gap-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-3 sm:p-4">
      <Quote className="size-4 sm:size-5 text-emerald-400 dark:text-emerald-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-base font-medium text-emerald-800 dark:text-emerald-300 italic leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">
          — {quote.author}
        </p>
      </div>
    </div>
  )
}

// --- Main Achievements Section ---
export function AchievementsSection({ caseData }: AchievementsSectionProps) {
  const { setActiveView } = useAppStore()
  const { celebrate, CelebrationOverlay } = useCelebration()

  // Calculate all streak data
  const cleanStreak = useMemo<CleanStreakResult>(
    () => calculateCleanStreak(caseData.drugTests || []),
    [caseData.drugTests]
  )

  const meetingStreak = useMemo<MeetingStreakResult>(
    () => calculateMeetingStreak(caseData.naMeetings || []),
    [caseData.naMeetings]
  )

  const counselingRate = useMemo<CounselingRateResult>(
    () => calculateCounselingRate(caseData.counselingSessions || []),
    [caseData.counselingSessions]
  )

  const overallProgress = useMemo<OverallProgressResult>(
    () => calculateOverallProgress(
      caseData,
      caseData.requirements || [],
      caseData.drugTests || [],
      caseData.naSteps || [],
      caseData.naMeetings || [],
      caseData.counselingSessions || []
    ),
    [caseData]
  )

  const milestones = useMemo(
    () => getMilestones(cleanStreak.current, 'clean'),
    [cleanStreak.current]
  )

  // Check for milestone celebrations using a ref to track previous streak
  const prevStreakRef = useRef<number | null>(null)
  useEffect(() => {
    const currentStreak = cleanStreak.current
    const prevStreak = prevStreakRef.current
    prevStreakRef.current = currentStreak

    if (prevStreak !== null && currentStreak > prevStreak) {
      const milestone = milestones.find((m) => m.days === currentStreak && m.achieved)
      if (milestone) {
        celebrate(milestone.message, milestone.emoji)
      }
    }
  }, [cleanStreak.current, milestones, celebrate])

  // Find next milestone for progress bar
  const nextMilestone = milestones.find((m) => !m.achieved)
  const prevMilestone = [...milestones].reverse().find((m) => m.achieved)
  const cleanProgressToNext = nextMilestone
    ? Math.round(((cleanStreak.current - (prevMilestone?.days || 0)) / (nextMilestone.days - (prevMilestone?.days || 0))) * 100)
    : 100

  return (
    <div className="space-y-4 sm:space-y-5">
      <CelebrationOverlay />

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 sm:size-5 text-emerald-600" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">Your Streaks & Achievements</h2>
        </div>
        {overallProgress.achievements.filter((a) => a.achieved).length > 0 && (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            {overallProgress.achievements.filter((a) => a.achieved).length} earned
          </Badge>
        )}
      </div>

      {/* Clean Streak Hero Card */}
      <AchievementCard
        emoji="🔥"
        label="Clean Streak"
        value={cleanStreak.current}
        subtitle="days clean"
        progress={cleanProgressToNext}
        progressLabel={
          nextMilestone
            ? `${nextMilestone.days - cleanStreak.current} days to ${nextMilestone.label}`
            : 'All milestones achieved! 🎉'
        }
        colorClass="bg-emerald-500"
        onClick={() => setActiveView('drug-testing')}
        badge={
          cleanStreak.current >= 7
            ? `${cleanStreak.current}d streak`
            : undefined
        }
      />

      {/* Streak & Progress Cards Grid */}
      <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* NA Meetings */}
        <AchievementCard
          icon={<Users className="size-5 text-violet-600" />}
          label="NA Meetings"
          value={`${meetingStreak.meetingsThisWeek}/${meetingStreak.weeklyGoal}`}
          subtitle="this week"
          progress={Math.round((meetingStreak.meetingsThisWeek / meetingStreak.weeklyGoal) * 100)}
          progressLabel={
            meetingStreak.currentWeeks > 0
              ? `${meetingStreak.currentWeeks} week streak • ${meetingStreak.totalAttended} total`
              : `${meetingStreak.totalAttended} attended total`
          }
          colorClass="bg-violet-500"
          onClick={() => setActiveView('na-meetings')}
          badge={
            meetingStreak.meetingsThisWeek >= meetingStreak.weeklyGoal
              ? '✅ On track'
              : undefined
          }
        />

        {/* Counseling Sessions */}
        <AchievementCard
          icon={<MessageSquareHeart className="size-5 text-green-600" />}
          label="Counseling"
          value={`${counselingRate.completed}/${counselingRate.total}`}
          subtitle={`sessions (${counselingRate.percentage}%)`}
          progress={counselingRate.percentage}
          progressLabel={
            counselingRate.percentage >= 75
              ? 'Great completion rate! 💪'
              : counselingRate.percentage >= 50
                ? 'Keep showing up!'
                : 'Every session counts'
          }
          colorClass="bg-green-500"
          onClick={() => setActiveView('counseling')}
          badge={
            counselingRate.percentage >= 75
              ? '💬 Committed'
              : undefined
          }
        />

        {/* Overall Progress */}
        <AchievementCard
          icon={<Star className="size-5 text-amber-600" />}
          label="Overall Progress"
          value={`${overallProgress.percentage}%`}
          subtitle="complete"
          progress={overallProgress.percentage}
          progressLabel={
            overallProgress.percentage >= 75
              ? 'Almost there! 🏁'
              : overallProgress.percentage >= 50
                ? 'Halfway there!'
                : 'Keep pushing forward'
          }
          colorClass="bg-amber-500"
          onClick={() => setActiveView('case-plan')}
          badge={
            overallProgress.percentage >= 50
              ? '⭐ Halfway+'
              : undefined
          }
        />
      </div>

      {/* Achievement Badges */}
      {overallProgress.achievements.filter((a) => a.achieved).length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Achievements Unlocked
          </p>
          <AchievementBadges achievements={overallProgress.achievements} />
        </div>
      )}

      {/* Milestone Progress (visual timeline) */}
      {milestones.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Clean Streak Milestones
          </p>
          <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1">
            {milestones.map((m) => (
              <div
                key={m.days}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 sm:px-3 py-2 shrink-0 transition-all ${
                  m.achieved
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-muted/30 border-muted/50 opacity-60'
                }`}
                title={m.message}
              >
                <span className={`text-base sm:text-lg ${m.achieved ? '' : 'grayscale opacity-50'}`}>
                  {m.emoji}
                </span>
                <span className={`text-[10px] sm:text-xs font-medium ${
                  m.achieved
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground'
                }`}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Quote */}
      <MotivationalQuote />
    </div>
  )
}
