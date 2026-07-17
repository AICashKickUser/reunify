'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  CaseInfo, CaseRequirement, CounselingSession, DrugTest, 
  NAStep, NAMeeting, SupervisedVisit, CourtDate, 
  ParentingClass, Milestone, DailyCheckIn 
} from '@/lib/types'

// Fetch all cases
export function useCases() {
  return useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await fetch('/api/cases')
      if (!res.ok) throw new Error('Failed to fetch cases')
      return res.json() as Promise<CaseInfo[]>
    },
  })
}

// Fetch single case with all related data
export function useCase(id: string | null) {
  return useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      if (!id) return null
      const res = await fetch(`/api/cases/${id}`)
      if (!res.ok) throw new Error('Failed to fetch case')
      return res.json() as Promise<CaseInfo & {
        requirements: CaseRequirement[]
        counselingSessions: CounselingSession[]
        drugTests: DrugTest[]
        naSteps: NAStep[]
        naMeetings: NAMeeting[]
        supervisedVisits: SupervisedVisit[]
        courtDates: CourtDate[]
        parentingClasses: ParentingClass[]
        milestones: Milestone[]
        dailyCheckIns: DailyCheckIn[]
      }>
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
      const res = await fetch(`/api/requirements?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch requirements')
      return res.json() as Promise<CaseRequirement[]>
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
      const res = await fetch(`/api/counseling?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch counseling sessions')
      return res.json() as Promise<CounselingSession[]>
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
      const res = await fetch(`/api/drug-tests?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch drug tests')
      return res.json() as Promise<DrugTest[]>
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
      const res = await fetch(`/api/na-steps?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch NA steps')
      return res.json() as Promise<NAStep[]>
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
      const res = await fetch(`/api/na-meetings?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch NA meetings')
      return res.json() as Promise<NAMeeting[]>
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
      const res = await fetch(`/api/supervised-visits?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch supervised visits')
      return res.json() as Promise<SupervisedVisit[]>
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
      const res = await fetch(`/api/court-dates?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch court dates')
      return res.json() as Promise<CourtDate[]>
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
      const res = await fetch(`/api/parenting-classes?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch parenting classes')
      return res.json() as Promise<ParentingClass[]>
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
      const res = await fetch(`/api/milestones?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch milestones')
      return res.json() as Promise<Milestone[]>
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
      const res = await fetch(`/api/daily-checkins?caseId=${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch daily checkins')
      return res.json() as Promise<DailyCheckIn[]>
    },
    enabled: !!caseId,
  })
}

// Generic create mutation
export function useCreateItem(endpoint: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Failed to create ${endpoint}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
    },
  })
}

// Generic update mutation
export function useUpdateItem(endpoint: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Failed to update ${endpoint}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
    },
  })
}

// Generic delete mutation
export function useDeleteItem(endpoint: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${endpoint}/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(`Failed to delete ${endpoint}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] })
      queryClient.invalidateQueries({ queryKey: ['case'] })
    },
  })
}

// Create case mutation
export function useCreateCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create case')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

// Seed database
export function useSeedDatabase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to seed database')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] })
    },
  })
}

// Reset case data (delete all related data, keep case)
export function useResetCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (caseId: string) => {
      const res = await fetch(`/api/cases/${caseId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to reset case data')
      return res.json()
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
    },
  })
}
