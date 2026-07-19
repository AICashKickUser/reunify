// Types for the Reunify app

export interface CaseInfo {
  id: string
  caseNumber: string
  courtName: string | null
  caseworkerName: string | null
  caseworkerPhone: string | null
  judgeName: string | null
  attorneyName: string | null
  attorneyPhone: string | null
  removalDate: string | null
  targetReunificationDate: string | null
  caseStatus: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CaseRequirement {
  id: string
  caseId: string
  category: string
  title: string
  description: string | null
  frequency: string | null
  isCompleted: boolean
  completedAt: string | null
  dueDate: string | null
  notes: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CounselingSession {
  id: string
  caseId: string
  date: string
  counselorName: string | null
  sessionType: string | null
  duration: number | null
  notes: string | null
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface DrugTest {
  id: string
  caseId: string
  date: string
  testType: string | null
  isRandom: boolean
  result: string | null
  testingFacility: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface NAStep {
  id: string
  caseId: string
  stepNumber: number
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  sponsorVerified: boolean
  sponsorName: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface NAMeeting {
  id: string
  caseId: string
  date: string
  meetingName: string | null
  location: string | null
  speaker: string | null
  topic: string | null
  isVerified: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface SupervisedVisit {
  id: string
  caseId: string
  date: string
  location: string | null
  supervisorName: string | null
  duration: number | null
  childBehavior: string | null
  parentBehavior: string | null
  notes: string | null
  isCompleted: boolean
  visitType: string | null
  createdAt: string
  updatedAt: string
}

export interface CourtDate {
  id: string
  caseId: string
  date: string
  hearingType: string | null
  outcome: string | null
  judgeNotes: string | null
  nextSteps: string | null
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface ParentingClass {
  id: string
  caseId: string
  date: string
  className: string | null
  provider: string | null
  topic: string | null
  isCompleted: boolean
  hasCertificate: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  caseId: string
  title: string
  description: string | null
  category: string
  targetDate: string | null
  completedAt: string | null
  isCompleted: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DailyCheckIn {
  id: string
  caseId: string
  date: string
  mood: string | null
  drugTestRequired: boolean
  drugTestCompleted: boolean
  meetingsAttended: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Category colors for visual consistency
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'counseling': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'drug-testing': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'na-meetings': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'na-steps': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'supervised-visits': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'parenting-classes': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'housing': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'employment': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'legal': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  'family': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'education': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'milestone': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'other': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
}

export const NA_STEP_TITLES: Record<number, string> = {
  1: 'We admitted we were powerless over our addiction, that our lives had become unmanageable.',
  2: 'We came to believe that a Power greater than ourselves could restore us to sanity.',
  3: 'We made a decision to turn our will and our lives over to the care of God as we understood Him.',
  4: 'We made a searching and fearless moral inventory of ourselves.',
  5: 'We admitted to God, to ourselves, and to another human being the exact nature of our wrongs.',
  6: 'We were entirely ready to have God remove all these defects of character.',
  7: 'We humbly asked Him to remove our shortcomings.',
  8: 'We made a list of all persons we had harmed, and became willing to make amends to them all.',
  9: 'We made direct amends to such people wherever possible, except when to do so would injure them or others.',
  10: 'We continued to take personal inventory and when we were wrong promptly admitted it.',
  11: 'We sought through prayer and meditation to improve our conscious contact with God as we understood Him, praying only for knowledge of His will for us and the power to carry that out.',
  12: 'Having had a spiritual awakening as a result of these steps, we tried to carry this message to addicts, and to practice these principles in all our affairs.',
}
