import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the local calendar date as "YYYY-MM-DD".
 * Uses local timezone methods (getFullYear/getMonth/getDate)
 * instead of UTC (toISOString), so the date matches what the user sees on their clock.
 *
 * This is critical for CPS parents — if they log a meeting at 8pm PDT,
 * toISOString() would return the NEXT day (UTC), which is wrong.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse a stored date string (possibly UTC midnight or noon) and return
 * a Date object at local midnight of the intended calendar day.
 *
 * This prevents the timezone shift bug where UTC midnight July 23
 * becomes July 22 in Pacific time.
 */
export function parseLocalDate(dateStr: string): Date {
  const dateOnly = dateStr.slice(0, 10) // "YYYY-MM-DD"
  const [y, m, d] = dateOnly.split('-').map(Number)
  return new Date(y, m - 1, d) // local midnight — always correct day
}
