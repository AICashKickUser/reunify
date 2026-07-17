import { create } from 'zustand'

export type ViewType = 
  | 'dashboard'
  | 'timeline'
  | 'case-plan'
  | 'counseling'
  | 'drug-testing'
  | 'na-steps'
  | 'na-meetings'
  | 'supervised-visits'
  | 'court-dates'
  | 'parenting-classes'
  | 'daily-checkins'
  | 'progress'
  | 'go-pro'

interface AppState {
  activeView: ViewType
  activeCaseId: string | null
  sidebarOpen: boolean
  addDialogTrigger: number
  setActiveView: (view: ViewType) => void
  setActiveCaseId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  triggerAddDialog: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  activeCaseId: null,
  sidebarOpen: true,
  addDialogTrigger: 0,
  setActiveView: (view) => set({ activeView: view }),
  setActiveCaseId: (id) => set({ activeCaseId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  triggerAddDialog: () => set((state) => ({ addDialogTrigger: state.addDialogTrigger + 1 })),
}))

export const VIEW_LABELS: Record<ViewType, string> = {
  'dashboard': 'Dashboard',
  'timeline': 'Timeline',
  'case-plan': 'Case Plan',
  'counseling': 'Counseling',
  'drug-testing': 'Drug Testing',
  'na-steps': '12 Steps',
  'na-meetings': 'NA Meetings',
  'supervised-visits': 'Visits',
  'court-dates': 'Court Dates',
  'parenting-classes': 'Parenting Classes',
  'daily-checkins': 'Daily Check-in',
  'progress': 'Progress Report',
  'go-pro': 'Upgrade to Pro',
}
