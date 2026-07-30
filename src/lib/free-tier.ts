/**
 * Free tier limits configuration for the Reunify app.
 * Free users can track up to FREE_TIER_LIMIT items per category.
 * Pro users have unlimited tracking.
 */

export const FREE_TIER_LIMITS: Record<string, number> = {
  counseling: 3,
  'drug-tests': 3,
  'na-meetings': 3,
  'na-steps': 3,
  'supervised-visits': 3,
  'court-dates': 3,
  'parenting-classes': 3,
  'daily-checkins': 3,
  milestones: 3,
  requirements: 3,
}

/**
 * Returns true if the user can add more items in the given category.
 * Pro users always return true.
 */
export function canAddItem(category: string, currentCount: number, isPro: boolean): boolean {
  if (isPro) return true
  const limit = FREE_TIER_LIMITS[category]
  if (limit === undefined) return true // uncategorized = no limit for free
  return currentCount < limit
}

/**
 * Returns a friendly, encouraging message about the free tier limit.
 * These parents are going through a difficult time — be supportive.
 */
export function getFreeTierMessage(category: string): string {
  const displayName = getCategoryDisplayName(category)
  const limit = FREE_TIER_LIMITS[category] ?? 3
  return `You've logged ${limit} ${displayName}! That's great progress!`
}

/**
 * Returns a human-readable display name for a category endpoint.
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    counseling: 'counseling sessions',
    'drug-tests': 'drug tests',
    'na-meetings': 'NA meetings',
    'na-steps': 'NA steps',
    'supervised-visits': 'supervised visits',
    'court-dates': 'court dates',
    'parenting-classes': 'parenting classes',
    'daily-checkins': 'daily check-ins',
    milestones: 'milestones',
    requirements: 'requirements',
  }
  return names[category] || category
}
