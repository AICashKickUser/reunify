'use client'

import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { getMilestones, type CleanStreakResult } from '@/lib/streaks'

type StreakStatus = 'active' | 'recent' | 'broken'

function getStreakStatus(streak: number): StreakStatus {
  if (streak >= 7) return 'active'
  if (streak > 0) return 'recent'
  return 'broken'
}

function getStreakColors(status: StreakStatus) {
  switch (status) {
    case 'active':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-400',
        accent: 'text-emerald-600 dark:text-emerald-400',
        barBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        barFill: 'bg-emerald-500',
        glow: 'shadow-emerald-200/50 dark:shadow-emerald-900/30',
      }
    case 'recent':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-400',
        accent: 'text-amber-600 dark:text-amber-400',
        barBg: 'bg-amber-100 dark:bg-amber-900/40',
        barFill: 'bg-amber-500',
        glow: 'shadow-amber-200/50 dark:shadow-amber-900/30',
      }
    case 'broken':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-400',
        accent: 'text-red-600 dark:text-red-400',
        barBg: 'bg-red-100 dark:bg-red-900/40',
        barFill: 'bg-red-500',
        glow: 'shadow-red-200/50 dark:shadow-red-900/30',
      }
  }
}

interface StreakDisplayProps {
  streak: CleanStreakResult
  compact?: boolean
  onClick?: () => void
}

export function StreakDisplay({ streak, compact = false, onClick }: StreakDisplayProps) {
  const status = getStreakStatus(streak.current)
  const colors = getStreakColors(status)
  const milestones = useMemo(() => getMilestones(streak.current, 'clean'), [streak.current])

  // Find next milestone
  const nextMilestone = milestones.find((m) => !m.achieved)
  const prevMilestone = [...milestones].reverse().find((m) => m.achieved)
  const progressToNext = nextMilestone
    ? Math.round(((streak.current - (prevMilestone?.days || 0)) / (nextMilestone.days - (prevMilestone?.days || 0))) * 100)
    : 100

  if (compact) {
    return (
      <button
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${colors.bg} ${colors.border} transition-all hover:shadow-md active:scale-[0.98] w-full`}
        onClick={onClick}
        type="button"
      >
        <span className="text-lg sm:text-xl" role="img" aria-label="fire">
          {status === 'active' ? '🔥' : status === 'recent' ? '🌿' : '💔'}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className={`text-lg sm:text-xl font-bold ${colors.accent}`}>
              {streak.current}
            </span>
            <span className="text-xs text-muted-foreground">days clean</span>
          </div>
          {nextMilestone && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Progress value={Math.max(0, Math.min(100, progressToNext))} className="h-1 flex-1" />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {nextMilestone.days}d
              </span>
            </div>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      className={`relative rounded-xl border-2 p-4 sm:p-6 ${colors.bg} ${colors.border} transition-all hover:shadow-lg ${colors.glow} active:scale-[0.98] w-full text-left`}
      onClick={onClick}
      type="button"
    >
      {/* Fire emoji + streak number */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-3xl sm:text-5xl" role="img" aria-label="fire">
          {status === 'active' ? '🔥' : status === 'recent' ? '🌿' : '💔'}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${colors.accent}`}>
              {streak.current}
            </span>
            <span className={`text-sm sm:text-base font-medium ${colors.text}`}>
              days clean
            </span>
          </div>
          {streak.longest > streak.current && streak.current > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Longest streak: {streak.longest} days
            </p>
          )}
          {streak.current === 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Start your clean streak today!
            </p>
          )}
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mt-3 sm:mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {nextMilestone.emoji} Next: {nextMilestone.label} ({nextMilestone.days} days)
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {nextMilestone.days - streak.current} days to go
            </span>
          </div>
          <div className="relative">
            <Progress value={Math.max(0, Math.min(100, progressToNext))} className="h-2.5" />
          </div>
        </div>
      )}

      {/* All milestones achieved */}
      {!nextMilestone && streak.current > 0 && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <span className="text-lg">🎉</span>
          All milestones achieved! You&apos;re incredible!
        </div>
      )}

      {/* Milestone badges */}
      {milestones.filter((m) => m.achieved).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {milestones
            .filter((m) => m.achieved)
            .map((m) => (
              <span
                key={m.days}
                className="inline-flex items-center gap-0.5 rounded-full bg-white/60 dark:bg-black/20 px-2 py-0.5 text-xs font-medium border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
              >
                {m.emoji} {m.label}
              </span>
            ))}
        </div>
      )}
    </button>
  )
}
