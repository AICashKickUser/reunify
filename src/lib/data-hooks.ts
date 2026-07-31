'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  CaseInfo, CaseRequirement, CounselingSession, DrugTest, 
  NAStep, NAMeeting, SupervisedVisit, CourtDate, 
  ParentingClass, Milestone, DailyCheckIn 
} from '@/lib/types'
import { recordActivity, type CelebrationType } from '@/lib/streaks'
import { canAddItem, FREE_TIER_LIMITS } from '@/lib/free-tier'
import { useSubscriptionStore } from '@/lib/subscription'
import {
  getAllCases,
  getCaseWithRelated,
  getRequirements,
  getCounselingSessions,
  getDrugTests,
  getNASteps,
  getNAMeetings,
  getSupervisedVisits,
  getCourtDates,
  getParentingClasses,
  getMilestones,
  getDailyCheckIns,
  createCase as dbCreateCase,
  deleteCase as dbDeleteCase,
  createItemByEndpoint,
  updateItemByEndpoint,
  deleteItemByEndpoint,
  resetCaseData,
  seedDemoData,
  clearAllData,
  invalidateQueries,
} from '@/lib/client-db'

// Map endpoint names to activity types for streak tracking
function endpointToActivityType(endpoint: string): string {
  const mapping: Record<string, string> = {
    'counseling': 'counseling',
    'drug-tests': 'drug-test',
    'na-meetings': 'na-meeting',
    'na-steps': 'na-step',
    'supervised-visits': 'supervised-visit',
    'court-dates': 'court-date',
    'parenting-classes': 'parenting-class',
    'milestones': 'milestone',
    'daily-checkins': 'check-in',
    'requirements': 'requirement',
  }
  return mapping[endpoint] || endpoint
}

// Record activity and trigger celebration if milestone hit
function handleActivityRecorded(type: string): void {
  const celebrationType = recordActivity(type)
  if (celebrationType) {
    // Dispatch custom event for celebration overlay to pick up
    window.dispatchEvent(new CustomEvent('celebration-trigger', { detail: celebrationType }))
  }
  // Dispatch event to update streak displays
  window.dispatchEvent(new CustomEvent('streak-updated'))
}

// Fetch all cases
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      return getAllCases()
    },
  })
}

// Fetch single case with all related data
export function useCase(id: string | null) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      if (!id) return null
      return getCaseWithRelated(id)
    },
    enabled: !!id,
  })
}

// Fetch case requirements
export function useRequirements(caseId: string | null) {
  return useQuery({
    queryKey: ['requirements', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getRequirements(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch counseling sessions
export function useCounselingSessions(caseId: string | null) {
  return useQuery({
    queryKey: ['counseling', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getCounselingSessions(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch drug tests
export function useDrugTests(caseId: string | null) {
  return useQuery({
    queryKey: ['drug-tests', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getDrugTests(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch NA steps
export function useNASteps(caseId: string | null) {
  return useQuery({
    queryKey: ['na-steps', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getNASteps(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch NA meetings
export function useNAMeetings(caseId: string | null) {
  return useQuery({
    queryKey: ['na-meetings', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getNAMeetings(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch supervised visits
export function useSupervisedVisits(caseId: string | null) {
  return useQuery({
    queryKey: ['supervised-visits', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getSupervisedVisits(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch court dates
export function useCourtDates(caseId: string | null) {
  return useQuery({
    queryKey: ['court-dates', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getCourtDates(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch parenting classes
export function useParentingClasses(caseId: string | null) {
  return useQuery({
    queryKey: ['parenting-classes', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getParentingClasses(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch milestones
export function useMilestones(caseId: string | null) {
  return useQuery({
    queryKey: ['milestones', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getMilestones(caseId)
    },
    enabled: !!caseId,
  })
}

// Fetch daily checkins
export function useDailyCheckIns(caseId: string | null) {
  return useQuery({
    queryKey: ['daily-checkins', caseId],
    queryFn: async () => {
      if (!caseId) return []
      return getDailyCheckIns(caseId)
    },
    enabled: !!caseId,
  })
}

/**
 * Hook to check free tier limits for a given category.
 * Returns whether the user can add more items and the current limit.
 */
export function useFreeTierCheck(category: string, currentCount: number) {
  const { isPro } = useSubscriptionStore()
  const pro = isPro()
  const limit = FREE_TIER_LIMITS[category] ?? Infinity
  const atLimit = !canAddItem(category, currentCount, pro)
  const nearLimit = !pro && limit !== Infinity && currentCount >= limit - 1 && currentCount < limit

  return {
    atLimit,
    nearLimit,
    limit: pro ? Infinity : limit,
    canAdd: !atLimit,
    isPro: pro,
  }
}

// Generic create mutation
export function useCreateItem(endpoint: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return createItemByEndpoint(endpoint, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
      // Also dispatch our custom invalidation event
      invalidateQueries([endpoint, 'case'])
      // Record activity for streak tracking
      handleActivityRecorded(endpointToActivityType(endpoint))
      // Dispatch free tier limit event if this category has a limit
      const limit = FREE_TIER_LIMITS[endpoint]
      if (limit !== undefined) {
        window.dispatchEvent(new CustomEvent('free-tier-item-created', { detail: { category: endpoint } }))
      }
    },
  })
}

// Generic update mutation
export function useUpdateItem(endpoint: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      return updateItemByEndpoint(endpoint, id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
      invalidateQueries([endpoint, 'case'])
      // Record activity for streak tracking (updates count as activity too)
      handleActivityRecorded(endpointToActivityType(endpoint))
    },
  })
}

// Generic delete mutation
export function useDeleteItem(endpoint: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      return deleteItemByEndpoint(endpoint, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
      invalidateQueries([endpoint, 'case'])
    },
  })
}

// Create case mutation
export function useCreateCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return dbCreateCase(data as Partial<CaseInfo>)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      invalidateQueries(['cases'])
    },
  })
}

// Delete case and all related data
export function useDeleteCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (caseId: string) => {
      return dbDeleteCase(caseId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      queryClient.invalidateQueries({ queryKey: ['counseling'] })
      queryClient.invalidateQueries({ queryKey: ['drug-tests'] })
      queryClient.invalidateQueries({ queryKey: ['na-steps'] })
      queryClient.invalidateQueries({ queryKey: ['na-meetings'] })
      queryClient.invalidateQueries({ queryKey: ['supervised-visits'] })
      queryClient.invalidateQueries({ queryKey: ['court-dates'] })
      queryClient.invalidateQueries({ queryKey: ['parenting-classes'] })
      queryClient.invalidateQueries({ queryKey: ['milestones'] })
      queryClient.invalidateQueries({ queryKey: ['daily-checkins'] })
      invalidateQueries()
    },
  })
}

// Seed database
export function useSeedDatabase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      return seedDemoData()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
      invalidateQueries(['cases'])
    },
  })
}

// Reset case data (delete all related data, keep case)
export function useResetCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (caseId: string) => {
      return resetCaseData(caseId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case'] })
      queryClient.invalidateQueries({ queryKey: ['requirements'] })
      queryClient.invalidateQueries({ queryKey: ['counseling'] })
      queryClient.invalidateQueries({ queryKey: ['drug-tests'] })
      queryClient.invalidateQueries({ queryKey: ['na-steps'] })
      queryClient.invalidateQueries({ queryKey: ['na-meetings'] })
      queryClient.invalidateQueries({ queryKey: ['supervised-visits'] })
      queryClient.invalidateQueries({ queryKey: ['court-dates'] })
      queryClient.invalidateQueries({ queryKey: ['parenting-classes'] })
      queryClient.invalidateQueries({ queryKey: ['milestones'] })
      queryClient.invalidateQueries({ queryKey: ['daily-checkins'] })
      invalidateQueries()
    },
  })
}
