/**
 * Free tier limits configuration for the Reunify app.
 * Free users can track up to FREE_TIER_LIMIT items per category.
 * Pro users have unlimited tracking.
 */

export const FREE_TIER_LIMITS: Record<string, number> = {
  counseling: 5,
  'drug-tests': 15,
  'na-meetings': 5,
  'na-steps': 12,
  'supervised-visits': 5,
  'court-dates': 5,
  'parenting-classes': 20,
  'daily-checkins': 7,
  milestones: 5,
  requirements: 10,
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
  const limit = FREE_TIER_LIMITS[category] ?? 5
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
