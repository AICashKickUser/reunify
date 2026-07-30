'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import {
  getStreakData,
  getStreakDays,
  getNextMilestone,
  getLastActiveText,
  type StreakData,
  type WeeklySummary,
  getWeeklySummary,
} from '@/lib/streaks'
import { Flame, Trophy, Star, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalActiveDays: 0,
  thisWeekActive: 0,
}

// --- Sidebar Streak Badge (compact) ---

/**
 * Compact streak badge for the sidebar header.
 * Shows fire emoji + streak count + "Last active: X".
 */
export function StreakBadge() {
  const [streak, setStreak] = useState(0)
  const [lastActive, setLastActive] = useState('')

  useEffect(() => {
    function refresh() {
      try {
        const data = getStreakData()
        setStreak(data.currentStreak)
        setLastActive(getLastActiveText())
      } catch {
        // Ignore localStorage errors
      }
    }

    refresh()

    // Listen for custom events (same-tab updates)
    window.addEventListener('streak-updated', refresh)
    window.addEventListener('focus', refresh)
    // Also poll every 30s in case of external changes
    const interval = setInterval(refresh, 30000)

    return () => {
      window.removeEventListener('streak-updated', refresh)
      window.removeEventListener('focus', refresh)
      clearInterval(interval)
    }
  }, [])

  if (streak === 0) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/50 text-muted-foreground">
        <Flame className="size-4 opacity-50" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight">Start your streak!</p>
          <p className="text-[10px] leading-tight">{lastActive || 'Log activity today'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${
      streak >= 7
        ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800'
        : streak >= 3
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          : 'bg-muted/50 border border-muted/50'
    }`}>
      <span className="text-base" role="img" aria-label="streak">
        {streak >= 7 ? '🔥' : streak >= 3 ? '🌱' : '🌿'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-bold ${
            streak >= 7
              ? 'text-emerald-700 dark:text-emerald-400'
              : streak >= 3
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-foreground'
          }`}>
            {streak}
          </span>
          <span className="text-[10px] text-muted-foreground">day{streak !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">{lastActive}</p>
      </div>
    </div>
  )
}

// --- Dashboard Streak Card ---

/**
 * Full streak display card for the dashboard.
 * Shows current streak, longest streak, progress to next milestone, and weekly activity.
 */
export function StreakCard() {
  const [streakData, setStreakData] = useState<StreakData>(DEFAULT_STREAK)

  useEffect(() => {
    function refresh() {
      try {
        const data = getStreakData()
        setStreakData(data)
      } catch {
        // Ignore localStorage errors
      }
    }

    refresh()

    window.addEventListener('streak-updated', refresh)
    window.addEventListener('focus', refresh)
    const interval = setInterval(refresh, 30000)

    return () => {
      window.removeEventListener('streak-updated', refresh)
      window.removeEventListener('focus', refresh)
      clearInterval(interval)
    }
  }, [])

  const nextMilestone = getNextMilestone()
  const lastActive = getLastActiveText()

  const progressToNext = nextMilestone
    ? Math.round((streakData.currentStreak / nextMilestone.days) * 100)
    : 100

  const streak = streakData.currentStreak

  return (
    <div className={`rounded-xl border-2 p-4 sm:p-5 transition-all ${
      streak >= 7
        ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-950/10 border-emerald-200 dark:border-emerald-800'
        : streak >= 3
          ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-950/10 border-amber-200 dark:border-amber-800'
          : 'bg-muted/30 border-muted/50'
    }`}>
      {/* Streak number + fire */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-3xl sm:text-4xl" role="img" aria-label="streak">
          {streak >= 7 ? '🔥' : streak >= 3 ? '🌱' : streak > 0 ? '🌿' : '💪'}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
              streak >= 7
                ? 'text-emerald-700 dark:text-emerald-400'
                : streak >= 3
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-foreground'
            }`}>
              {streak}
            </span>
            <span className={`text-sm sm:text-base font-medium ${
              streak >= 7
                ? 'text-emerald-600 dark:text-emerald-400'
                : streak >= 3
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
            }`}>
              day streak
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last active: {lastActive}
          </p>
        </div>
        {streakData.longestStreak > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="size-3.5" />
            <span>Best: {streakData.longestStreak}d</span>
          </div>
        )}
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && (
        <div className="mt-3 sm:mt-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {getCelebrationEmojiForMilestone(nextMilestone.type)} Next: {nextMilestone.days} days
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {nextMilestone.days - streak} to go
            </span>
          </div>
          <Progress value={Math.max(0, Math.min(100, progressToNext))} className="h-2" />
        </div>
      )}

      {/* All milestones achieved */}
      {!nextMilestone && streak > 0 && (
        <div className="mt-3 sm:mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <Star className="size-4" />
          All milestones achieved! You&apos;re incredible!
        </div>
      )}

      {/* Weekly activity summary */}
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Flame className="size-3" />
          {streakData.thisWeekActive}/7 days this week
        </span>
        <span>•</span>
        <span>{streakData.totalActiveDays} total active days</span>
      </div>
    </div>
  )
}

// --- Dashboard Weekly Summary Card ---

export function WeeklySummaryCard() {
  const [summary, setSummary] = useState<WeeklySummary | null>(() => {
    if (typeof window === 'undefined') return null
    try { return getWeeklySummary() } catch { return null }
  })

  useEffect(() => {
    const handleUpdate = () => {
      try { setSummary(getWeeklySummary()) } catch { /* ignore */ }
    }
    window.addEventListener('streak-updated', handleUpdate)
    const interval = setInterval(handleUpdate, 60000)
    return () => {
      window.removeEventListener('streak-updated', handleUpdate)
      clearInterval(interval)
    }
  }, [])

  if (!summary) return null

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-emerald-600" />
          This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Week day dots */}
        <div className="flex items-center justify-between gap-1">
          {days.map((day, i) => {
            const isActive = i < summary.daysActive
            return (
              <div key={day} className="flex flex-col items-center gap-1">
                <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {isActive ? '✓' : day[0]}
                </div>
                <span className="text-[9px] text-muted-foreground">{day}</span>
              </div>
            )
          })}
        </div>

        {/* Activity breakdown */}
        {Object.keys(summary.categories).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(summary.categories).map(([cat, count]) => (
              <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                {cat}: {count}
              </span>
            ))}
          </div>
        )}

        {/* Motivational quote */}
        <p className="text-xs text-muted-foreground italic border-t pt-2">
          &ldquo;{summary.motivationalQuote}&rdquo;
        </p>
      </CardContent>
    </Card>
  )
}

function getCelebrationEmojiForMilestone(type: string): string {
  const emojis: Record<string, string> = {
    '3-day': '🌱',
    '7-day': '🔥',
    '14-day': '💪',
    '30-day': '⭐',
    '60-day': '🏆',
    '90-day': '🎉',
  }
  return emojis[type] || '🎯'
}
