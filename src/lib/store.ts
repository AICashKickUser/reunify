import { create } from 'zustand'

export type ViewType = 
  | 'dashboard'
  | 'timeline'
  | 'case-plan'
  | 'scan-case-plan'
  | 'counseling'
  | 'drug-testing'
  | 'na-steps'
  | 'na-meetings'
  | 'supervised-visits'
  | 'court-dates'
  | 'parenting-classes'
  | 'daily-checkins'
  | 'progress'
  | 'backup'

const ACTIVE_CASE_KEY = 'reunify-active-case-id'

function getStoredCaseId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_CASE_KEY)
  } catch {
    return null
  }
}

function storeCaseId(id: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CASE_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_CASE_KEY)
    }
  } catch {
    // localStorage not available
  }
}

interface AppState {
  activeView: ViewType
  activeCaseId: string | null
  sidebarOpen: boolean
  addDialogTrigger: number
  viewHistory: ViewType[]
  setActiveView: (view: ViewType) => void
  goBack: () => ViewType | null
  setActiveCaseId: (id: string | null) => void
  setSidebarOpen: (open: boolean) => void
  triggerAddDialog: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  activeView: 'dashboard',
  // Initialize from localStorage so the case survives page reloads
  activeCaseId: getStoredCaseId(),
  sidebarOpen: true,
  addDialogTrigger: 0,
  viewHistory: [],
  setActiveView: (view) => {
    const current = get().activeView
    // Don't push if same view
    if (current === view) return
    // Push current view to history before changing
    set({ activeView: view, viewHistory: [...get().viewHistory, current] })
  },
  goBack: () => {
    const history = get().viewHistory
    if (history.length === 0) return null
    const previousView = history[history.length - 1]
    set({
      activeView: previousView,
      viewHistory: history.slice(0, -1),
    })
    return previousView
  },
  setActiveCaseId: (id) => {
    storeCaseId(id)
    set({ activeCaseId: id })
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  triggerAddDialog: () => set((state) => ({ addDialogTrigger: state.addDialogTrigger + 1 })),
}))

export const VIEW_LABELS: Record<ViewType, string> = {
  'dashboard': 'Dashboard',
  'timeline': 'Timeline',
  'case-plan': 'Case Plan',
  'scan-case-plan': 'Scan Case Plan',
  'counseling': 'Counseling',
  'drug-testing': 'Drug Testing',
  'na-steps': '12 Steps',
  'na-meetings': 'NA Meetings',
  'supervised-visits': 'Visits',
  'court-dates': 'Court Dates',
  'parenting-classes': 'Parenting Classes',
  'daily-checkins': 'Daily Check-in',
  'progress': 'Progress Report',
  'backup': 'Backup & Restore',
}
