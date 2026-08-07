// Streak tracking library for the Reunify CPS reunification tracking app
// Part 1: localStorage-based daily activity streak tracking (Task 4)
// Part 2: Existing data-driven streak calculations (kept for achievements-section)

import type { DrugTest, NAMeeting, CounselingSession, CaseInfo, CaseRequirement, NAStep } from '@/lib/types'
import { parseLocalDate, getLocalDateString } from '@/lib/utils'
import { differenceInDays, startOfWeek, endOfWeek, isWithinInterval, isBefore } from 'date-fns'

// ============================================================
// PART 1: localStorage-based daily activity streak tracking
// ============================================================

// --- Types ---

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null  // YYYY-MM-DD
  totalActiveDays: number
  thisWeekActive: number  // days active this week
}

export interface WeeklySummary {
  daysActive: number
  totalActivities: number
  categories: Record<string, number>
  streakMaintained: boolean
  motivationalQuote: string
}

export type CelebrationType = '3-day' | '7-day' | '14-day' | '30-day' | '60-day' | '90-day'

interface ActivityRecord {
  date: string   // YYYY-MM-DD
  type: string   // check-in, counseling, drug-test, na-meeting, na-step, supervised-visit, court-date, parenting-class, milestone
  timestamp: string // ISO string
}

interface StreakHistory {
  activities: ActivityRecord[]
  celebratedMilestones: string[] // CelebrationType values already shown
}

const STREAK_DATA_KEY = 'reunify-streak-data'
const STREAK_HISTORY_KEY = 'reunify-streak-history'

const CELEBRATION_MILESTONES: Record<number, CelebrationType> = {
  3: '3-day',
  7: '7-day',
  14: '14-day',
  30: '30-day',
  60: '60-day',
  90: '90-day',
}

// Curated motivational quotes for CPS reunification context
const MOTIVATIONAL_QUOTES_CPS = [
  'Every day you show up is a day closer to your kids.',
  'Consistency is the most powerful force in reunification.',
  'The court sees your effort. Keep going.',
  'Your kids are proud of you, even if they can\'t say it yet.',
  'Recovery isn\'t linear, but showing up matters.',
  'You\'re not just checking boxes — you\'re building a future.',
  'The hardest days often matter the most.',
  'Small steps, big progress.',
  'Your commitment today shapes your family\'s tomorrow.',
  'One day at a time. That\'s all it takes.',
]

// --- Helper functions ---

function getStreakDataFromStorage(): StreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalActiveDays: 0, thisWeekActive: 0 }
  }
  try {
    const stored = localStorage.getItem(STREAK_DATA_KEY)
    if (stored) {
      return JSON.parse(stored) as StreakData
    }
  } catch {
    // ignore parse errors
  }
  return { currentStreak: 0, longestStreak: 0, lastActiveDate: null, totalActiveDays: 0, thisWeekActive: 0 }
}

function saveStreakData(data: StreakData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STREAK_DATA_KEY, JSON.stringify(data))
  } catch {
    // ignore storage errors
  }
}

function getStreakHistoryFromStorage(): StreakHistory {
  if (typeof window === 'undefined') {
    return { activities: [], celebratedMilestones: [] }
  }
  try {
    const stored = localStorage.getItem(STREAK_HISTORY_KEY)
    if (stored) {
      return JSON.parse(stored) as StreakHistory
    }
  } catch {
    // ignore parse errors
  }
  return { activities: [], celebratedMilestones: [] }
}

function saveStreakHistory(history: StreakHistory): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(history))
  } catch {
    // ignore storage errors
  }
}

/**
 * Calculate the current streak from a set of unique active dates.
 * A streak is consecutive days with at least one activity, ending at today or yesterday.
 */
function calculateStreakFromDates(activeDates: string[]): { currentStreak: number; longestStreak: number } {
  if (activeDates.length === 0) return { currentStreak: 0, longestStreak: 0 }

  const uniqueDates = [...new Set(activeDates)].sort() // sort ascending
  const today = getLocalDateString()
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getLocalDateString(d)
  })()

  // Current streak: count backwards from today or yesterday
  let currentStreak = 0
  const lastDate = uniqueDates[uniqueDates.length - 1]

  if (lastDate === today || lastDate === yesterday) {
    // The streak is still alive
    let checkDate = lastDate
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      if (uniqueDates[i] === checkDate) {
        currentStreak++
        // Move to previous day
        const d = new Date(checkDate + 'T12:00:00.000Z')
        d.setDate(d.getDate() - 1)
        checkDate = getLocalDateString(d)
      } else if (uniqueDates[i] < checkDate) {
        // Gap found, streak broken
        break
      }
    }
  }
  // else: last activity was more than 1 day ago, currentStreak = 0

  // Longest streak: scan all dates
  let longestStreak = 0
  let tempStreak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T12:00:00.000Z')
    const curr = new Date(uniqueDates[i] + 'T12:00:00.000Z')
    const diff = differenceInDays(curr, prev)
    if (diff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  return { currentStreak, longestStreak }
}

/**
 * Count how many days in the current week (Mon-Sun) have activity.
 */
function countThisWeekActive(activeDates: string[]): number {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const uniqueDates = [...new Set(activeDates)]
  return uniqueDates.filter(d => {
    try {
      const date = parseLocalDate(d)
      return isWithinInterval(date, { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  }).length
}

// --- Public API ---

/**
 * Get the current streak data from localStorage.
 */
export function getStreakData(): StreakData {
  const history = getStreakHistoryFromStorage()
  const activeDates = history.activities.map(a => a.date)
  const { currentStreak, longestStreak } = calculateStreakFromDates(activeDates)
  const today = getLocalDateString()
  const lastActiveDate = activeDates.length > 0
    ? [...activeDates].sort().pop() || null
    : null
  const thisWeekActive = countThisWeekActive(activeDates)

  const data: StreakData = {
    currentStreak,
    longestStreak,
    lastActiveDate,
    totalActiveDays: new Set(activeDates).size,
    thisWeekActive,
  }

  // Persist the computed data for quick reads
  saveStreakData(data)
  return data
}

/**
 * Record an activity in the streak tracking system.
 * Called when the user logs any activity (check-in, counseling, drug test, etc.)
 * Returns the CelebrationType if a milestone was hit, null otherwise.
 */
export function recordActivity(type: string): CelebrationType | null {
  const today = getLocalDateString()
  const history = getStreakHistoryFromStorage()

  // Add the activity record
  history.activities.push({
    date: today,
    type,
    timestamp: new Date().toISOString(),
  })

  // Keep only last 365 days of activity to prevent localStorage bloat
  const cutoff = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 365)
    return getLocalDateString(d)
  })()
  history.activities = history.activities.filter(a => a.date >= cutoff)

  // Calculate streak
  const activeDates = history.activities.map(a => a.date)
  const { currentStreak, longestStreak } = calculateStreakFromDates(activeDates)

  // Check for celebration milestone
  const milestone = CELEBRATION_MILESTONES[currentStreak]
  if (milestone && !history.celebratedMilestones.includes(milestone)) {
    history.celebratedMilestones.push(milestone)
    saveStreakHistory(history)
    saveStreakData({
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      totalActiveDays: new Set(activeDates).size,
      thisWeekActive: countThisWeekActive(activeDates),
    })
    return milestone
  }

  saveStreakHistory(history)
  saveStreakData({
    currentStreak,
    longestStreak,
    lastActiveDate: today,
    totalActiveDays: new Set(activeDates).size,
    thisWeekActive: countThisWeekActive(activeDates),
  })
  return null
}

/**
 * Get the current streak count (days in a row with activity).
 */
export function getStreakDays(): number {
  return getStreakData().currentStreak
}

/**
 * Get the all-time longest streak.
 */
export function getLongestStreak(): number {
  return getStreakData().longestStreak
}

/**
 * Check if a celebration should be shown.
 * Returns the celebration type if a milestone was just hit, or null.
 */
export function shouldShowCelebration(): CelebrationType | null {
  const data = getStreakData()
  const milestone = CELEBRATION_MILESTONES[data.currentStreak]
  if (!milestone) return null

  const history = getStreakHistoryFromStorage()
  if (history.celebratedMilestones.includes(milestone)) return null

  return milestone
}

/**
 * Get a random motivational quote from the curated CPS reunification list.
 */
export function getMotivationalQuote(): string {
  return MOTIVATIONAL_QUOTES_CPS[Math.floor(Math.random() * MOTIVATIONAL_QUOTES_CPS.length)]
}

/**
 * Get a summary of this week's activity.
 */
export function getWeeklySummary(): WeeklySummary {
  const history = getStreakHistoryFromStorage()
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const thisWeekActivities = history.activities.filter(a => {
    try {
      const d = parseLocalDate(a.date)
      return isWithinInterval(d, { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  })

  const activeDays = new Set(thisWeekActivities.map(a => a.date)).size
  const categories: Record<string, number> = {}
  for (const a of thisWeekActivities) {
    categories[a.type] = (categories[a.type] || 0) + 1
  }

  const streakData = getStreakData()
  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getLocalDateString(d)
  })()
  const today = getLocalDateString()
  const streakMaintained = streakData.lastActiveDate === today || streakData.lastActiveDate === yesterday

  return {
    daysActive: activeDays,
    totalActivities: thisWeekActivities.length,
    categories,
    streakMaintained,
    motivationalQuote: getMotivationalQuote(),
  }
}

/**
 * Get the last active date as a human-readable string.
 * Returns "Today", "Yesterday", "X hours ago", "X days ago", or "Not yet"
 */
export function getLastActiveText(): string {
  const data = getStreakData()
  if (!data.lastActiveDate) return 'Not yet'

  const today = getLocalDateString()
  if (data.lastActiveDate === today) return 'Today'

  const yesterday = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return getLocalDateString(d)
  })()
  if (data.lastActiveDate === yesterday) return 'Yesterday'

  const diff = differenceInDays(new Date(today + 'T12:00:00.000Z'), new Date(data.lastActiveDate + 'T12:00:00.000Z'))
  if (diff <= 7) return `${diff} days ago`
  return `${Math.floor(diff / 7)} week${Math.floor(diff / 7) > 1 ? 's' : ''} ago`
}

/**
 * Mark a celebration milestone as shown (so it won't be shown again).
 */
export function markCelebrationShown(type: CelebrationType): void {
  const history = getStreakHistoryFromStorage()
  if (!history.celebratedMilestones.includes(type)) {
    history.celebratedMilestones.push(type)
    saveStreakHistory(history)
  }
}

/**
 * Get the celebration milestone label.
 */
export function getCelebrationLabel(type: CelebrationType): string {
  const labels: Record<CelebrationType, string> = {
    '3-day': '3 Day Streak!',
    '7-day': '1 Week Streak!',
    '14-day': '2 Week Streak!',
    '30-day': '1 Month Streak!',
    '60-day': '2 Month Streak!',
    '90-day': '3 Month Streak!',
  }
  return labels[type]
}

/**
 * Get the celebration milestone emoji.
 */
export function getCelebrationEmoji(type: CelebrationType): string {
  const emojis: Record<CelebrationType, string> = {
    '3-day': '🌱',
    '7-day': '🔥',
    '14-day': '💪',
    '30-day': '⭐',
    '60-day': '🏆',
    '90-day': '🎉',
  }
  return emojis[type]
}

/**
 * Get the next milestone to work toward.
 */
export function getNextMilestone(): { days: number; type: CelebrationType } | null {
  const streak = getStreakDays()
  const milestones = [3, 7, 14, 30, 60, 90] as const
  for (const days of milestones) {
    if (streak < days) {
      return { days, type: CELEBRATION_MILESTONES[days] }
    }
  }
  return null
}

// ============================================================
// PART 2: Existing data-driven streak calculations
// (kept for achievements-section.tsx compatibility)
// ============================================================

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

export function calculateCleanStreak(drugTests: DrugTest[]): CleanStreakResult {
  if (!drugTests || drugTests.length === 0) {
    return { current: 0, longest: 0, startDate: null }
  }

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

  let currentStreak = 0
  let startDate: string | null = null

  for (let i = testsWithResults.length - 1; i >= 0; i--) {
    const test = testsWithResults[i]
    // Only 'negative' counts as clean. Anything else (positive, diluted, refused, pending) breaks the streak.
    if (test.result !== 'negative') {
      break
    }
    currentStreak++
    startDate = test.date
  }

  let longestStreak = 0
  let tempStreak = 0

  for (const test of testsWithResults) {
    // Only 'negative' extends the streak. Anything else breaks it.
    if (test.result !== 'negative') {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 0
    } else {
      tempStreak++
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  if (currentStreak === 0 && testsWithResults.every((t) => t.result === 'negative')) {
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

export function calculateMeetingStreak(meetings: NAMeeting[]): MeetingStreakResult {
  if (!meetings || meetings.length === 0) {
    return { currentWeeks: 0, totalAttended: 0, meetingsThisWeek: 0, weeklyGoal: 3 }
  }

  const verifiedMeetings = meetings.filter((m) => m.date && m.isVerified)
  const totalAttended = verifiedMeetings.length

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  const meetingsThisWeek = verifiedMeetings.filter((m) => {
    try {
      const d = parseLocalDate(m.date)
      return isWithinInterval(d, { start: weekStart, end: weekEnd })
    } catch {
      return false
    }
  }).length

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

  const sortedWeeks = [...weekMap.entries()]
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())

  let currentWeeks = 0
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString().slice(0, 10)
  const lastWeekStart = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }).toISOString().slice(0, 10)

  if (sortedWeeks.length === 0) {
    return { currentWeeks: 0, totalAttended, meetingsThisWeek, weeklyGoal: 3 }
  }

  const mostRecentWeek = sortedWeeks[0][0]

  if (isBefore(new Date(mostRecentWeek), new Date(lastWeekStart)) && mostRecentWeek !== lastWeekStart && mostRecentWeek !== currentWeekStart) {
    return { currentWeeks: 0, totalAttended, meetingsThisWeek, weeklyGoal: 3 }
  }

  let expectedWeek = mostRecentWeek
  for (const [weekKey] of sortedWeeks) {
    if (weekKey === expectedWeek) {
      currentWeeks++
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

export function calculateOverallProgress(
  caseData: CaseInfo,
  requirements: CaseRequirement[],
  drugTests: DrugTest[],
  naSteps: NAStep[],
  meetings: NAMeeting[],
  sessions: CounselingSession[]
): OverallProgressResult {
  const completedReqs = requirements.filter((r) => r.isCompleted).length
  const totalReqs = requirements.length || 1
  const reqPct = Math.round((completedReqs / totalReqs) * 100)

  const cleanStreak = calculateCleanStreak(drugTests)
  const totalTestsWithResults = drugTests.filter((t) => t.result).length
  const cleanTests = drugTests.filter((t) => t.result === 'negative').length
  const drugPct = totalTestsWithResults > 0 ? Math.round((cleanTests / totalTestsWithResults) * 100) : 0

  const completedSteps = naSteps.filter((s) => s.isCompleted).length
  const stepsPct = Math.round((completedSteps / 12) * 100)

  const counselingRate = calculateCounselingRate(sessions)
  const meetingStreak = calculateMeetingStreak(meetings)

  const overallPct = Math.round(
    (reqPct * 0.35 + drugPct * 0.25 + stepsPct * 0.15 + counselingRate.percentage * 0.15 + Math.min(100, (meetingStreak.currentWeeks / 12) * 100) * 0.10)
  )

  const achievements: Achievement[] = []

  if (cleanStreak.current >= 7) {
    achievements.push({ id: 'clean-7', title: 'One Week Clean', description: '7 consecutive clean drug tests', emoji: '🌱', achieved: true, category: 'clean-streak' })
  }
  if (cleanStreak.current >= 30) {
    achievements.push({ id: 'clean-30', title: 'One Month Clean', description: '30 consecutive clean drug tests', emoji: '🔥', achieved: true, category: 'clean-streak' })
  }
  if (cleanStreak.current >= 90) {
    achievements.push({ id: 'clean-90', title: 'Three Months Clean', description: '90 consecutive clean drug tests', emoji: '⭐', achieved: true, category: 'clean-streak' })
  }
  if (meetingStreak.currentWeeks >= 4) {
    achievements.push({ id: 'meeting-4', title: 'Monthly Meeting Streak', description: '4 consecutive weeks of NA meetings', emoji: '👥', achieved: true, category: 'meetings' })
  }
  if (meetingStreak.totalAttended >= 12) {
    achievements.push({ id: 'meeting-12', title: 'Dozen Meetings', description: 'Attended 12 NA meetings total', emoji: '🤝', achieved: true, category: 'meetings' })
  }
  if (counselingRate.percentage >= 75 && counselingRate.total >= 4) {
    achievements.push({ id: 'counseling-75', title: 'Committed to Counseling', description: '75%+ counseling session completion rate', emoji: '💬', achieved: true, category: 'counseling' })
  }
  if (counselingRate.completed >= 12) {
    achievements.push({ id: 'counseling-12', title: 'Counseling Champion', description: 'Completed 12 counseling sessions', emoji: '🧠', achieved: true, category: 'counseling' })
  }
  if (completedSteps >= 12) {
    achievements.push({ id: 'na-complete', title: 'All 12 Steps Complete', description: 'Completed all 12 NA steps', emoji: '🪜', achieved: true, category: 'overall' })
  }
  if (reqPct >= 100) {
    achievements.push({ id: 'all-reqs', title: 'All Requirements Met', description: 'All case plan requirements completed', emoji: '🎯', achieved: true, category: 'overall' })
  }
  if (overallPct >= 50) {
    achievements.push({ id: 'halfway', title: 'Halfway There', description: '50% overall progress achieved', emoji: '🏁', achieved: true, category: 'overall' })
  }

  return { percentage: overallPct, streak: cleanStreak.current, achievements }
}

// --- Motivational Quotes (legacy for achievements-section) ---

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
