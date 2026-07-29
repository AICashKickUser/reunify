// Streak calculation logic for the Reunify CPS reunification tracking app

import type { DrugTest, NAMeeting, CounselingSession, CaseInfo, CaseRequirement, NAStep } from '@/lib/types'
import { parseLocalDate } from '@/lib/utils'
import { differenceInDays, startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns'

// --- Types ---

export interface CleanStreakResult {
  current: number
  longest: number
  startDate: string | null
}

export interface MeetingStreakResult {
  currentWeeks: number
  totalAttended: number
  meetingsThisWeek: number
  weeklyGoal: number
}

export interface CounselingRateResult {
  completed: number
  total: number
  percentage: number
}

export interface Milestone {
  days: number
  label: string
  emoji: string
  message: string
  achieved: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  emoji: string
  achieved: boolean
  category: 'clean-streak' | 'meetings' | 'counseling' | 'overall'
  achievedDate?: string
}

export interface OverallProgressResult {
  percentage: number
  streak: number
  achievements: Achievement[]
}

// --- Clean Streak ---

/**
 * Calculate the consecutive days of clean drug tests.
 * - Only a "positive" result breaks the streak.
 * - "pending" and "diluted" do NOT break the streak.
 * - "negative" results continue the streak.
 * - Tests are sorted by date descending; we count backwards from the most recent.
 */
export function calculateCleanStreak(drugTests: DrugTest[]): CleanStreakResult {
  if (!drugTests || drugTests.length === 0) {
    return { current: 0, longest: 0, startDate: null }
  }

  // Filter to tests that have a result (skip pending with no result at all)
  const testsWithResults = drugTests
    .filter((t) => t.date && t.result)
    .map((t) => ({
      date: t.date,
      result: t.result!.toLowerCase(),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (testsWithResults.length === 0) {
    return { current: 0, longest: 0, startDate: null }
  }

  // Calculate current streak (from the most recent test backwards)
  let currentStreak = 0
  let startDate: string | null = null

  // Work backwards from the most recent test
  for (let i = testsWithResults.length - 1; i >= 0; i--) {
    const test = testsWithResults[i]
    if (test.result === 'positive') {
      // A positive result breaks the streak
      break
    }
    // negative, diluted, pending — all continue the streak
    currentStreak++
    startDate = test.date
  }

  // Calculate longest streak ever
  let longestStreak = 0
  let tempStreak = 0

  for (const test of testsWithResults) {
    if (test.result === 'positive') {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 0
    } else {
      tempStreak++
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  // If current streak is 0 but there are no positive results, count all tests
  if (currentStreak === 0 && testsWithResults.every((t) => t.result !== 'positive')) {
    currentStreak = testsWithResults.length
    startDate = testsWithResults[0].date
  }

  return {
    current: currentStreak,
    longest: Math.max(longestStreak, currentStreak),
    startDate,
  }
}

// --- Meeting Streak ---

/**
 * Calculate consecutive weeks of NA meeting attendance.
 * Uses verified meetings (isVerified) as attended meetings.
 * Counts consecutive weeks that had at least one meeting.
 */
export function calculateMeetingStreak(meetings: NAMeeting[]): MeetingStreakResult {
  if (!meetings || meetings.length === 0) {
    return { currentWeeks: 0, totalAttended: 0, meetingsThisWeek: 0, weeklyGoal: 3 }
  }

  const verifiedMeetings = meetings.filter((m) => m.date && m.isVerified)
  const totalAttended = verifiedMeetings.length

  // Calculate meetings this week
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday

  const meetingsThisWeek = verifiedMeetings.filter((m) => {
    try {
      const d = parseLocalDate(m.date)
      return isWithinInterval(d, { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  }).length

  // Group meetings by week
  const weekMap = new Map<string, number>()
  for (const m of verifiedMeetings) {
    try {
      const d = parseLocalDate(m.date)
      const weekStartForDate = startOfWeek(d, { weekStartsOn: 1 })
      const key = weekStartForDate.toISOString().slice(0, 10)
      weekMap.set(key, (weekMap.get(key) || 0) + 1)
    } catch {
      // skip
    }
  }

  // Sort weeks descending
  const sortedWeeks = [...weekMap.entries()]
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())

  // Count consecutive weeks from the current or most recent week
  let currentWeeks = 0
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().slice(0, 10)
  const lastWeekStart = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }).toISOString().slice(0, 10)

  // Check if the current week or last week has meetings (to still count as "current streak")
  if (sortedWeeks.length === 0) {
    return { currentWeeks: 0, totalAttended, meetingsThisWeek, weeklyGoal: 3 }
  }

  // Start from the most recent week that has meetings
  const mostRecentWeek = sortedWeeks[0][0]

  // If the most recent meeting week is more than 2 weeks ago, streak is broken
  if (isBefore(new Date(mostRecentWeek), new Date(lastWeekStart)) && mostRecentWeek !== lastWeekStart && mostRecentWeek !== currentWeekStart) {
    return { currentWeeks: 0, totalAttended, meetingsThisWeek, weeklyGoal: 3 }
  }

  // Count consecutive weeks
  let expectedWeek = mostRecentWeek
  for (const [weekKey] of sortedWeeks) {
    if (weekKey === expectedWeek) {
      currentWeeks++
      // Move to previous week
      const prevWeek = new Date(expectedWeek)
      prevWeek.setDate(prevWeek.getDate() - 7)
      expectedWeek = prevWeek.toISOString().slice(0, 10)
    } else {
      break
    }
  }

  return { currentWeeks, totalAttended, meetingsThisWeek, weeklyGoal: 3 }
}

// --- Counseling Rate ---

/**
 * Calculate counseling session completion rate.
 */
export function calculateCounselingRate(sessions: CounselingSession[]): CounselingRateResult {
  if (!sessions || sessions.length === 0) {
    return { completed: 0, total: 0, percentage: 0 }
  }

  const total = sessions.length
  const completed = sessions.filter((s) => s.isCompleted).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return { completed, total, percentage }
}

// --- Milestones ---

const MILESTONE_DEFINITIONS = [
  { days: 7, label: '1 Week', emoji: '🌱', message: '7 Days Clean! You\'re planting the seed of change!' },
  { days: 14, label: '2 Weeks', emoji: '🌿', message: '14 Days Clean! Growing stronger every day!' },
  { days: 30, label: '1 Month', emoji: '🔥', message: '30 Days Clean! You\'re unstoppable!' },
  { days: 60, label: '2 Months', emoji: '💪', message: '60 Days Clean! Your dedication is inspiring!' },
  { days: 90, label: '3 Months', emoji: '⭐', message: '90 Days Clean! A major milestone achieved!' },
  { days: 180, label: '6 Months', emoji: '🏆', message: '180 Days Clean! Half a year of commitment!' },
  { days: 365, label: '1 Year', emoji: '🎉', message: '365 Days Clean! One year of incredible strength!' },
]

export function getMilestones(streak: number, type: string = 'clean'): Milestone[] {
  return MILESTONE_DEFINITIONS.map((m) => ({
    days: m.days,
    label: m.label,
    emoji: m.emoji,
    message: m.message,
    achieved: streak >= m.days,
  }))
}

// --- Overall Progress ---

/**
 * Calculate overall case progress and achievements.
 */
export function calculateOverallProgress(
  caseData: CaseInfo,
  requirements: CaseRequirement[],
  drugTests: DrugTest[],
  naSteps: NAStep[],
  meetings: NAMeeting[],
  sessions: CounselingSession[]
): OverallProgressResult {
  // Requirements progress
  const completedReqs = requirements.filter((r) => r.isCompleted).length
  const totalReqs = requirements.length || 1
  const reqPct = Math.round((completedReqs / totalReqs) * 100)

  // Drug test progress
  const cleanStreak = calculateCleanStreak(drugTests)
  const totalTestsWithResults = drugTests.filter((t) => t.result).length
  const cleanTests = drugTests.filter((t) => t.result === 'negative').length
  const drugPct = totalTestsWithResults > 0 ? Math.round((cleanTests / totalTestsWithResults) * 100) : 0

  // NA steps progress
  const completedSteps = naSteps.filter((s) => s.isCompleted).length
  const stepsPct = Math.round((completedSteps / 12) * 100)

  // Counseling progress
  const counselingRate = calculateCounselingRate(sessions)

  // Meeting progress
  const meetingStreak = calculateMeetingStreak(meetings)

  // Overall percentage (weighted average)
  const overallPct = Math.round(
    (reqPct * 0.35 + drugPct * 0.25 + stepsPct * 0.15 + counselingRate.percentage * 0.15 + Math.min(100, (meetingStreak.currentWeeks / 12) * 100) * 0.10)
  )

  // Build achievements
  const achievements: Achievement[] = []

  // Clean streak achievements
  if (cleanStreak.current >= 7) {
    achievements.push({
      id: 'clean-7',
      title: 'One Week Clean',
      description: '7 consecutive clean drug tests',
      emoji: '🌱',
      achieved: true,
      category: 'clean-streak',
    })
  }
  if (cleanStreak.current >= 30) {
    achievements.push({
      id: 'clean-30',
      title: 'One Month Clean',
      description: '30 consecutive clean drug tests',
      emoji: '🔥',
      achieved: true,
      category: 'clean-streak',
    })
  }
  if (cleanStreak.current >= 90) {
    achievements.push({
      id: 'clean-90',
      title: 'Three Months Clean',
      description: '90 consecutive clean drug tests',
      emoji: '⭐',
      achieved: true,
      category: 'clean-streak',
    })
  }

  // Meeting achievements
  if (meetingStreak.currentWeeks >= 4) {
    achievements.push({
      id: 'meeting-4',
      title: 'Monthly Meeting Streak',
      description: '4 consecutive weeks of NA meetings',
      emoji: '👥',
      achieved: true,
      category: 'meetings',
    })
  }
  if (meetingStreak.totalAttended >= 12) {
    achievements.push({
      id: 'meeting-12',
      title: 'Dozen Meetings',
      description: 'Attended 12 NA meetings total',
      emoji: '🤝',
      achieved: true,
      category: 'meetings',
    })
  }

  // Counseling achievements
  if (counselingRate.percentage >= 75 && counselingRate.total >= 4) {
    achievements.push({
      id: 'counseling-75',
      title: 'Committed to Counseling',
      description: '75%+ counseling session completion rate',
      emoji: '💬',
      achieved: true,
      category: 'counseling',
    })
  }
  if (counselingRate.completed >= 12) {
    achievements.push({
      id: 'counseling-12',
      title: 'Counseling Champion',
      description: 'Completed 12 counseling sessions',
      emoji: '🧠',
      achieved: true,
      category: 'counseling',
    })
  }

  // Overall achievements
  if (completedSteps >= 12) {
    achievements.push({
      id: 'na-complete',
      title: 'All 12 Steps Complete',
      description: 'Completed all 12 NA steps',
      emoji: '🪜',
      achieved: true,
      category: 'overall',
    })
  }
  if (reqPct >= 100) {
    achievements.push({
      id: 'all-reqs',
      title: 'All Requirements Met',
      description: 'All case plan requirements completed',
      emoji: '🎯',
      achieved: true,
      category: 'overall',
    })
  }
  if (overallPct >= 50) {
    achievements.push({
      id: 'halfway',
      title: 'Halfway There',
      description: '50% overall progress achieved',
      emoji: '🏁',
      achieved: true,
      category: 'overall',
    })
  }

  return {
    percentage: overallPct,
    streak: cleanStreak.current,
    achievements,
  }
}

// --- Motivational Quotes ---

export const MOTIVATIONAL_QUOTES = [
  { text: 'Every step brings you closer to your kids', author: 'Reunify' },
  { text: 'Progress, not perfection', author: 'Recovery Wisdom' },
  { text: 'One day at a time', author: 'Recovery Mantra' },
  { text: 'You are stronger than you think', author: 'Reunify' },
  { text: 'Your kids are counting on you — and you\'re showing up', author: 'Reunify' },
  { text: 'The fact that you\'re tracking this shows you care', author: 'Reunify' },
  { text: 'Clean today. Stronger tomorrow.', author: 'Reunify' },
  { text: 'This isn\'t just data — it\'s proof of your commitment', author: 'Reunify' },
  { text: 'Courts notice consistency. Keep showing up.', author: 'Reunify' },
  { text: 'Your journey matters. Every single day of it.', author: 'Reunify' },
]
