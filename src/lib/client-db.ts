/**
 * Client-side IndexedDB database layer for the Reunify CPS reunification case management PWA.
 * All user data is stored privately in the user's browser — no server-side storage.
 */

import { openDB, type IDBPDatabase } from 'idb'
import type {
  CaseInfo,
  CaseRequirement,
  CounselingSession,
  DrugTest,
  NAStep,
  NAMeeting,
  SupervisedVisit,
  CourtDate,
  ParentingClass,
  Milestone,
  DailyCheckIn,
} from '@/lib/types'

// ============================================================
// Database schema & initialization
// ============================================================

const DB_NAME = 'reunify-db'
const DB_VERSION = 1

type StoreName =
  | 'cases'
  | 'requirements'
  | 'counselingSessions'
  | 'drugTests'
  | 'naSteps'
  | 'naMeetings'
  | 'supervisedVisits'
  | 'courtDates'
  | 'parentingClasses'
  | 'milestones'
  | 'dailyCheckIns'

export const ALL_STORES: StoreName[] = [
  'cases',
  'requirements',
  'counselingSessions',
  'drugTests',
  'naSteps',
  'naMeetings',
  'supervisedVisits',
  'courtDates',
  'parentingClasses',
  'milestones',
  'dailyCheckIns',
]

let dbInstance: IDBPDatabase | null = null

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // cases store — no caseId index needed (it IS the case)
      if (!db.objectStoreNames.contains('cases')) {
        db.createObjectStore('cases', { keyPath: 'id' })
      }

      // All child stores have `id` as primary key and `caseId` as index
      const childStores: { name: StoreName }[] = [
        { name: 'requirements' },
        { name: 'counselingSessions' },
        { name: 'drugTests' },
        { name: 'naSteps' },
        { name: 'naMeetings' },
        { name: 'supervisedVisits' },
        { name: 'courtDates' },
        { name: 'parentingClasses' },
        { name: 'milestones' },
        { name: 'dailyCheckIns' },
      ]

      for (const { name } of childStores) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id' })
          store.createIndex('caseId', 'caseId', { unique: false })
        }
      }
    },
  })

  return dbInstance
}

// ============================================================
// ID generation (cuid-like)
// ============================================================

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  const randomPart2 = Math.random().toString(36).substring(2, 10)
  return `c${timestamp}${randomPart}${randomPart2}`
}

// ============================================================
// Generic CRUD operations
// ============================================================

async function createItem<T extends { id?: string }>(
  storeName: StoreName,
  item: T
): Promise<T & { id: string; createdAt: string; updatedAt: string }> {
  const db = await getDB()
  const now = new Date().toISOString()
  const record = {
    ...item,
    id: item.id || generateId(),
    createdAt: (item as Record<string, unknown>).createdAt as string || now,
    updatedAt: now,
  } as T & { id: string; createdAt: string; updatedAt: string }

  await db.put(storeName, record)
  return record
}

async function getItem<T>(storeName: StoreName, id: string): Promise<T | undefined> {
  const db = await getDB()
  return db.get(storeName, id) as Promise<T | undefined>
}

async function getAllItems<T>(storeName: StoreName): Promise<T[]> {
  const db = await getDB()
  return db.getAll(storeName) as Promise<T[]>
}

async function getItemsByCaseId<T>(storeName: StoreName, caseId: string): Promise<T[]> {
  const db = await getDB()
  return db.getAllFromIndex(storeName, 'caseId', caseId) as Promise<T[]>
}

async function updateItem<T extends Record<string, unknown>>(
  storeName: StoreName,
  id: string,
  data: T
): Promise<T & { id: string; updatedAt: string }> {
  const db = await getDB()
  const existing = await db.get(storeName, id)
  if (!existing) {
    throw new Error(`Item ${id} not found in ${storeName}`)
  }
  const now = new Date().toISOString()
  const updated = {
    ...existing,
    ...data,
    id, // ensure id is not overwritten
    updatedAt: now,
  }
  await db.put(storeName, updated)
  return updated as T & { id: string; updatedAt: string }
}

async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  const db = await getDB()
  await db.delete(storeName, id)
}

async function deleteItemsByCaseId(storeName: StoreName, caseId: string): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  const index = tx.store.index('caseId')
  let cursor = await index.openCursor(caseId)
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await tx.done
}

// ============================================================
// Case-specific operations
// ============================================================

export async function createCase(data: Partial<CaseInfo>): Promise<CaseInfo> {
  return createItem<Partial<CaseInfo>>('cases', {
    caseNumber: data.caseNumber || '',
    courtName: data.courtName ?? null,
    caseworkerName: data.caseworkerName ?? null,
    caseworkerPhone: data.caseworkerPhone ?? null,
    judgeName: data.judgeName ?? null,
    attorneyName: data.attorneyName ?? null,
    attorneyPhone: data.attorneyPhone ?? null,
    removalDate: data.removalDate ?? null,
    targetReunificationDate: data.targetReunificationDate ?? null,
    caseStatus: data.caseStatus || 'active',
    notes: data.notes ?? null,
  })
}

export async function getCase(id: string): Promise<CaseInfo | undefined> {
  return getItem<CaseInfo>('cases', id)
}

export async function getAllCases(): Promise<CaseInfo[]> {
  return getAllItems<CaseInfo>('cases')
}

export async function updateCase(id: string, data: Partial<CaseInfo>): Promise<CaseInfo> {
  return updateItem('cases', id, data) as Promise<CaseInfo>
}

export async function deleteCase(caseId: string): Promise<void> {
  // Delete all related data first
  const childStores: StoreName[] = [
    'requirements',
    'counselingSessions',
    'drugTests',
    'naSteps',
    'naMeetings',
    'supervisedVisits',
    'courtDates',
    'parentingClasses',
    'milestones',
    'dailyCheckIns',
  ]
  for (const store of childStores) {
    await deleteItemsByCaseId(store, caseId)
  }
  // Delete the case itself
  await deleteItem('cases', caseId)
}

export async function getCaseWithRelated(id: string): Promise<
  | (CaseInfo & {
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
    })
  | null
> {
  const caseData = await getCase(id)
  if (!caseData) return null

  const [requirements, counselingSessions, drugTests, naSteps, naMeetings, supervisedVisits, courtDates, parentingClasses, milestones, dailyCheckIns] = await Promise.all([
    getItemsByCaseId<CaseRequirement>('requirements', id),
    getItemsByCaseId<CounselingSession>('counselingSessions', id),
    getItemsByCaseId<DrugTest>('drugTests', id),
    getItemsByCaseId<NAStep>('naSteps', id),
    getItemsByCaseId<NAMeeting>('naMeetings', id),
    getItemsByCaseId<SupervisedVisit>('supervisedVisits', id),
    getItemsByCaseId<CourtDate>('courtDates', id),
    getItemsByCaseId<ParentingClass>('parentingClasses', id),
    getItemsByCaseId<Milestone>('milestones', id),
    getItemsByCaseId<DailyCheckIn>('dailyCheckIns', id),
  ])

  return {
    ...caseData,
    requirements,
    counselingSessions,
    drugTests,
    naSteps,
    naMeetings,
    supervisedVisits,
    courtDates,
    parentingClasses,
    milestones,
    dailyCheckIns,
  }
}

// ============================================================
// Requirement operations
// ============================================================

export async function createRequirement(data: Partial<CaseRequirement> & { caseId: string }): Promise<CaseRequirement> {
  return createItem('requirements', {
    caseId: data.caseId,
    category: data.category || 'other',
    title: data.title || '',
    description: data.description ?? null,
    frequency: data.frequency ?? null,
    isCompleted: data.isCompleted ?? false,
    completedAt: data.completedAt ?? null,
    dueDate: data.dueDate ?? null,
    notes: data.notes ?? null,
    sortOrder: data.sortOrder ?? 0,
  })
}

export async function getRequirements(caseId: string): Promise<CaseRequirement[]> {
  return getItemsByCaseId<CaseRequirement>('requirements', caseId)
}

export async function updateRequirement(id: string, data: Partial<CaseRequirement>): Promise<CaseRequirement> {
  return updateItem('requirements', id, data) as Promise<CaseRequirement>
}

export async function deleteRequirement(id: string): Promise<void> {
  return deleteItem('requirements', id)
}

// ============================================================
// Counseling session operations
// ============================================================

export async function createCounselingSession(data: Partial<CounselingSession> & { caseId: string }): Promise<CounselingSession> {
  return createItem('counselingSessions', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    counselorName: data.counselorName ?? null,
    sessionType: data.sessionType ?? null,
    duration: data.duration ?? null,
    notes: data.notes ?? null,
    isCompleted: data.isCompleted ?? false,
  })
}

export async function getCounselingSessions(caseId: string): Promise<CounselingSession[]> {
  return getItemsByCaseId<CounselingSession>('counselingSessions', caseId)
}

export async function updateCounselingSession(id: string, data: Partial<CounselingSession>): Promise<CounselingSession> {
  return updateItem('counselingSessions', id, data) as Promise<CounselingSession>
}

export async function deleteCounselingSession(id: string): Promise<void> {
  return deleteItem('counselingSessions', id)
}

// ============================================================
// Drug test operations
// ============================================================

export async function createDrugTest(data: Partial<DrugTest> & { caseId: string }): Promise<DrugTest> {
  return createItem('drugTests', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    testType: data.testType ?? null,
    isRandom: data.isRandom ?? false,
    result: data.result ?? null,
    testingFacility: data.testingFacility ?? null,
    notes: data.notes ?? null,
    callMade: data.callMade ?? false,
    callResult: data.callResult ?? null,
    tested: data.tested ?? false,
  })
}

export async function getDrugTests(caseId: string): Promise<DrugTest[]> {
  return getItemsByCaseId<DrugTest>('drugTests', caseId)
}

export async function updateDrugTest(id: string, data: Partial<DrugTest>): Promise<DrugTest> {
  return updateItem('drugTests', id, data) as Promise<DrugTest>
}

export async function deleteDrugTest(id: string): Promise<void> {
  return deleteItem('drugTests', id)
}

// ============================================================
// NA Step operations
// ============================================================

export async function createNAStep(data: Partial<NAStep> & { caseId: string }): Promise<NAStep> {
  return createItem('naSteps', {
    caseId: data.caseId,
    stepNumber: data.stepNumber ?? 1,
    title: data.title || '',
    description: data.description ?? null,
    isCompleted: data.isCompleted ?? false,
    completedAt: data.completedAt ?? null,
    sponsorVerified: data.sponsorVerified ?? false,
    sponsorName: data.sponsorName ?? null,
    notes: data.notes ?? null,
  })
}

export async function getNASteps(caseId: string): Promise<NAStep[]> {
  return getItemsByCaseId<NAStep>('naSteps', caseId)
}

export async function updateNAStep(id: string, data: Partial<NAStep>): Promise<NAStep> {
  return updateItem('naSteps', id, data) as Promise<NAStep>
}

export async function deleteNAStep(id: string): Promise<void> {
  return deleteItem('naSteps', id)
}

// ============================================================
// NA Meeting operations
// ============================================================

export async function createNAMeeting(data: Partial<NAMeeting> & { caseId: string }): Promise<NAMeeting> {
  return createItem('naMeetings', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    meetingName: data.meetingName ?? null,
    location: data.location ?? null,
    speaker: data.speaker ?? null,
    topic: data.topic ?? null,
    isVerified: data.isVerified ?? false,
    notes: data.notes ?? null,
  })
}

export async function getNAMeetings(caseId: string): Promise<NAMeeting[]> {
  return getItemsByCaseId<NAMeeting>('naMeetings', caseId)
}

export async function updateNAMeeting(id: string, data: Partial<NAMeeting>): Promise<NAMeeting> {
  return updateItem('naMeetings', id, data) as Promise<NAMeeting>
}

export async function deleteNAMeeting(id: string): Promise<void> {
  return deleteItem('naMeetings', id)
}

// ============================================================
// Supervised Visit operations
// ============================================================

export async function createSupervisedVisit(data: Partial<SupervisedVisit> & { caseId: string }): Promise<SupervisedVisit> {
  return createItem('supervisedVisits', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    location: data.location ?? null,
    supervisorName: data.supervisorName ?? null,
    duration: data.duration ?? null,
    childBehavior: data.childBehavior ?? null,
    parentBehavior: data.parentBehavior ?? null,
    notes: data.notes ?? null,
    isCompleted: data.isCompleted ?? false,
    visitType: data.visitType ?? null,
  })
}

export async function getSupervisedVisits(caseId: string): Promise<SupervisedVisit[]> {
  return getItemsByCaseId<SupervisedVisit>('supervisedVisits', caseId)
}

export async function updateSupervisedVisit(id: string, data: Partial<SupervisedVisit>): Promise<SupervisedVisit> {
  return updateItem('supervisedVisits', id, data) as Promise<SupervisedVisit>
}

export async function deleteSupervisedVisit(id: string): Promise<void> {
  return deleteItem('supervisedVisits', id)
}

// ============================================================
// Court Date operations
// ============================================================

export async function createCourtDate(data: Partial<CourtDate> & { caseId: string }): Promise<CourtDate> {
  return createItem('courtDates', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    hearingType: data.hearingType ?? null,
    outcome: data.outcome ?? null,
    judgeNotes: data.judgeNotes ?? null,
    nextSteps: data.nextSteps ?? null,
    notes: data.notes ?? null,
    isCompleted: data.isCompleted ?? false,
  })
}

export async function getCourtDates(caseId: string): Promise<CourtDate[]> {
  return getItemsByCaseId<CourtDate>('courtDates', caseId)
}

export async function updateCourtDate(id: string, data: Partial<CourtDate>): Promise<CourtDate> {
  return updateItem('courtDates', id, data) as Promise<CourtDate>
}

export async function deleteCourtDate(id: string): Promise<void> {
  return deleteItem('courtDates', id)
}

// ============================================================
// Parenting Class operations
// ============================================================

export async function createParentingClass(data: Partial<ParentingClass> & { caseId: string }): Promise<ParentingClass> {
  return createItem('parentingClasses', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    className: data.className ?? null,
    provider: data.provider ?? null,
    topic: data.topic ?? null,
    isCompleted: data.isCompleted ?? false,
    hasCertificate: data.hasCertificate ?? false,
    notes: data.notes ?? null,
  })
}

export async function getParentingClasses(caseId: string): Promise<ParentingClass[]> {
  return getItemsByCaseId<ParentingClass>('parentingClasses', caseId)
}

export async function updateParentingClass(id: string, data: Partial<ParentingClass>): Promise<ParentingClass> {
  return updateItem('parentingClasses', id, data) as Promise<ParentingClass>
}

export async function deleteParentingClass(id: string): Promise<void> {
  return deleteItem('parentingClasses', id)
}

// ============================================================
// Milestone operations
// ============================================================

export async function createMilestone(data: Partial<Milestone> & { caseId: string }): Promise<Milestone> {
  return createItem('milestones', {
    caseId: data.caseId,
    title: data.title || '',
    description: data.description ?? null,
    category: data.category || 'other',
    targetDate: data.targetDate ?? null,
    completedAt: data.completedAt ?? null,
    isCompleted: data.isCompleted ?? false,
    notes: data.notes ?? null,
  })
}

export async function getMilestones(caseId: string): Promise<Milestone[]> {
  return getItemsByCaseId<Milestone>('milestones', caseId)
}

export async function updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone> {
  return updateItem('milestones', id, data) as Promise<Milestone>
}

export async function deleteMilestone(id: string): Promise<void> {
  return deleteItem('milestones', id)
}

// ============================================================
// Daily Check-in operations
// ============================================================

export async function createDailyCheckIn(data: Partial<DailyCheckIn> & { caseId: string }): Promise<DailyCheckIn> {
  return createItem('dailyCheckIns', {
    caseId: data.caseId,
    date: data.date || new Date().toISOString(),
    mood: data.mood ?? null,
    drugTestRequired: data.drugTestRequired ?? false,
    drugTestCompleted: data.drugTestCompleted ?? false,
    meetingsAttended: data.meetingsAttended ?? 0,
    notes: data.notes ?? null,
  })
}

export async function getDailyCheckIns(caseId: string): Promise<DailyCheckIn[]> {
  return getItemsByCaseId<DailyCheckIn>('dailyCheckIns', caseId)
}

export async function updateDailyCheckIn(id: string, data: Partial<DailyCheckIn>): Promise<DailyCheckIn> {
  return updateItem('dailyCheckIns', id, data) as Promise<DailyCheckIn>
}

export async function deleteDailyCheckIn(id: string): Promise<void> {
  return deleteItem('dailyCheckIns', id)
}

// ============================================================
// Generic endpoint-based CRUD
// (Maps endpoint names to store names and operations)
// ============================================================

const ENDPOINT_TO_STORE: Record<string, StoreName> = {
  'requirements': 'requirements',
  'counseling': 'counselingSessions',
  'drug-tests': 'drugTests',
  'na-steps': 'naSteps',
  'na-meetings': 'naMeetings',
  'supervised-visits': 'supervisedVisits',
  'court-dates': 'courtDates',
  'parenting-classes': 'parentingClasses',
  'milestones': 'milestones',
  'daily-checkins': 'dailyCheckIns',
}

export function endpointToStoreName(endpoint: string): StoreName {
  return ENDPOINT_TO_STORE[endpoint] || (endpoint as StoreName)
}

export async function createItemByEndpoint(endpoint: string, data: Record<string, unknown>): Promise<unknown> {
  const storeName = endpointToStoreName(endpoint)
  return createItem(storeName, data as Partial<unknown> & { caseId: string })
}

export async function getItemsByEndpoint(endpoint: string, caseId: string): Promise<unknown[]> {
  const storeName = endpointToStoreName(endpoint)
  return getItemsByCaseId(storeName, caseId)
}

export async function updateItemByEndpoint(endpoint: string, id: string, data: Record<string, unknown>): Promise<unknown> {
  const storeName = endpointToStoreName(endpoint)
  return updateItem(storeName, id, data)
}

export async function deleteItemByEndpoint(endpoint: string, id: string): Promise<void> {
  const storeName = endpointToStoreName(endpoint)
  return deleteItem(storeName, id)
}

// ============================================================
// Reset case data (delete all related data, keep case)
// ============================================================

export async function resetCaseData(caseId: string): Promise<void> {
  const childStores: StoreName[] = [
    'requirements',
    'counselingSessions',
    'drugTests',
    'naSteps',
    'naMeetings',
    'supervisedVisits',
    'courtDates',
    'parentingClasses',
    'milestones',
    'dailyCheckIns',
  ]
  for (const store of childStores) {
    await deleteItemsByCaseId(store, caseId)
  }
}

// ============================================================
// Clear all data
// ============================================================

export async function clearAllData(): Promise<void> {
  const db = await getDB()
  for (const storeName of ALL_STORES) {
    await db.clear(storeName)
  }
}

// ============================================================
// Seed demo data
// (Mirrors the server-side /api/seed route exactly)
// ============================================================

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(10, 0, 0, 0)
  return d.toISOString()
}

export async function seedDemoData(): Promise<{ caseId: string; stats: Record<string, number> }> {
  // Clear existing data first
  await clearAllData()

  // Create demo case
  const demoCase = await createCase({
    caseNumber: 'CPS-2024-0847',
    courtName: 'Harris County Family Court - 313th District',
    caseworkerName: 'Maria Santos',
    caseworkerPhone: '(713) 555-0142',
    judgeName: 'Hon. Patricia Williams',
    attorneyName: 'David Chen',
    attorneyPhone: '(713) 555-0298',
    removalDate: new Date('2024-06-15').toISOString(),
    targetReunificationDate: new Date('2025-06-15').toISOString(),
    caseStatus: 'active',
    notes: '[DEMO DATA - For exploring the app only] Mother demonstrating consistent progress. Children placed with maternal grandmother. Working through substance abuse recovery program. All court-ordered services in compliance.',
  })

  const caseId = demoCase.id

  // NA Steps (1-12, first 3 completed)
  const stepTitles = [
    { title: 'We admitted we were powerless over our addiction', desc: 'Acknowledging loss of control over substance use and its impact on family' },
    { title: 'Came to believe that a Power greater than ourselves could restore us to sanity', desc: 'Developing faith in a higher purpose and recovery process' },
    { title: 'Made a decision to turn our will and our lives over to the care of God as we understood Him', desc: 'Surrendering control and trusting the recovery journey' },
    { title: 'Made a searching and fearless moral inventory of ourselves', desc: 'Taking honest stock of personal behaviors and their consequences' },
    { title: 'Admitted to God, to ourselves, and to another human being the exact nature of our wrongs', desc: 'Sharing the truth about our actions with a trusted person' },
    { title: 'Were entirely ready to have God remove all these defects of character', desc: 'Preparing ourselves to let go of harmful patterns' },
    { title: 'Humbly asked Him to remove our shortcomings', desc: 'Seeking help in overcoming character defects' },
    { title: 'Made a list of all persons we had harmed, and became willing to make amends to them all', desc: 'Identifying everyone affected by our addiction' },
    { title: 'Made direct amends to such people wherever possible, except when to do so would injure them or others', desc: 'Taking action to repair relationships and harm caused' },
    { title: 'Continued to take personal inventory and when we were wrong promptly admitted it', desc: 'Maintaining ongoing self-awareness and accountability' },
    { title: 'Sought through prayer and meditation to improve our conscious contact with God as we understood Him', desc: 'Deepening spiritual practice for continued growth' },
    { title: 'Having had a spiritual awakening as the result of these steps, we tried to carry this message to addicts', desc: 'Sharing recovery experience to help others find hope' },
  ]

  for (let i = 0; i < 12; i++) {
    const isCompleted = i < 3
    await createNAStep({
      caseId,
      stepNumber: i + 1,
      title: stepTitles[i].title,
      description: stepTitles[i].desc,
      isCompleted,
      completedAt: isCompleted ? daysAgo(90 - i * 20) : null,
      sponsorVerified: isCompleted,
      sponsorName: 'James Martinez',
      notes: isCompleted ? `Completed Step ${i + 1} with sponsor guidance` : null,
    })
  }

  // Counseling sessions
  const counselingData = [
    { date: daysAgo(56), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Initial assessment completed. Discussed substance use history and family dynamics.', isCompleted: true },
    { date: daysAgo(49), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Explored childhood trauma and coping mechanisms. Client showing openness.', isCompleted: true },
    { date: daysAgo(42), counselorName: 'Dr. Rachel Kim', sessionType: 'family', duration: 90, notes: 'Family session with maternal grandmother. Discussed communication strategies and boundaries.', isCompleted: true },
    { date: daysAgo(35), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Worked on trigger identification and management. Client making good progress.', isCompleted: true },
    { date: daysAgo(28), counselorName: 'Dr. Rachel Kim', sessionType: 'group', duration: 90, notes: 'First group therapy session. Client participated actively.', isCompleted: true },
    { date: daysAgo(21), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Addressed guilt and shame around removal. Coping strategies improving.', isCompleted: true },
    { date: daysAgo(14), counselorName: 'Dr. Rachel Kim', sessionType: 'couples', duration: 90, notes: 'Session with partner. Discussed rebuilding trust and communication.', isCompleted: true },
    { date: daysAgo(7), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Review of coping strategies. Client reports feeling more in control.', isCompleted: true },
    { date: daysAgo(2), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Discussed upcoming court date preparation. Client anxious but managing well.', isCompleted: true },
    { date: daysFromNow(5), counselorName: 'Dr. Rachel Kim', sessionType: 'individual', duration: 60, notes: 'Scheduled - regular session', isCompleted: false },
    { date: daysFromNow(12), counselorName: 'Dr. Rachel Kim', sessionType: 'family', duration: 90, notes: 'Scheduled - family session with children', isCompleted: false },
    { date: daysFromNow(19), counselorName: 'Dr. Rachel Kim', sessionType: 'group', duration: 90, notes: 'Scheduled - group therapy', isCompleted: false },
  ]

  for (const session of counselingData) {
    await createCounselingSession({ caseId, ...session })
  }

  // Drug tests
  const drugTestData = [
    { date: daysAgo(84), testType: 'urine', isRandom: false, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Baseline test upon case opening' },
    { date: daysAgo(70), testType: 'urine', isRandom: true, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Random spot check' },
    { date: daysAgo(56), testType: 'urine', isRandom: false, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Scheduled monthly test' },
    { date: daysAgo(49), testType: 'hair', isRandom: false, result: 'negative', testingFacility: 'Quest Diagnostics', notes: 'Quarterly hair follicle test - 90 day window clean' },
    { date: daysAgo(42), testType: 'urine', isRandom: true, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Random spot check' },
    { date: daysAgo(35), testType: 'urine', isRandom: false, result: 'diluted', testingFacility: 'Houston Drug Testing Center', notes: 'Sample diluted - retest required' },
    { date: daysAgo(33), testType: 'urine', isRandom: false, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Retest after diluted sample - clean' },
    { date: daysAgo(28), testType: 'urine', isRandom: true, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Random spot check' },
    { date: daysAgo(21), testType: 'urine', isRandom: false, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Scheduled monthly test' },
    { date: daysAgo(14), testType: 'saliva', isRandom: true, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Random oral swab' },
    { date: daysAgo(7), testType: 'urine', isRandom: false, result: 'negative', testingFacility: 'Houston Drug Testing Center', notes: 'Scheduled monthly test' },
    { date: daysAgo(3), testType: 'urine', isRandom: true, result: 'pending', testingFacility: 'Houston Drug Testing Center', notes: 'Random spot check - awaiting results' },
    { date: daysFromNow(2), testType: 'urine', isRandom: false, result: 'pending', testingFacility: 'Houston Drug Testing Center', notes: 'Scheduled monthly test' },
  ]

  for (const test of drugTestData) {
    await createDrugTest({ caseId, ...test })
  }

  // NA Meetings
  const naMeetingData = [
    { date: daysAgo(55), meetingName: 'Hope & Recovery', location: 'Community Center - 4500 Main St', speaker: 'Mark T.', topic: 'Acceptance and Surrender', isVerified: true, notes: 'Very impactful meeting on Step 1 work' },
    { date: daysAgo(50), meetingName: 'Monday Night Miracles', location: "St. Paul's Church - 2200 Travis", speaker: 'Lisa R.', topic: 'Building Trust', isVerified: true, notes: null },
    { date: daysAgo(43), meetingName: 'Hope & Recovery', location: 'Community Center - 4500 Main St', speaker: 'Open Share', topic: 'Triggers and Coping', isVerified: true, notes: 'Shared personal story for the first time' },
    { date: daysAgo(36), meetingName: 'Women in Recovery', location: 'YWCA - 3099 Alabama St', speaker: 'Sarah K.', topic: 'Motherhood and Recovery', isVerified: true, notes: 'Emotional session about parenting in recovery' },
    { date: daysAgo(29), meetingName: 'Hope & Recovery', location: 'Community Center - 4500 Main St', speaker: 'Open Share', topic: 'Step 2 Discussion', isVerified: true, notes: null },
    { date: daysAgo(22), meetingName: 'Monday Night Miracles', location: "St. Paul's Church - 2200 Travis", speaker: 'Tom B.', topic: 'Honesty in Recovery', isVerified: true, notes: null },
    { date: daysAgo(15), meetingName: 'Hope & Recovery', location: 'Community Center - 4500 Main St', speaker: 'Open Share', topic: 'Service and Giving Back', isVerified: true, notes: 'Volunteered to help set up chairs' },
    { date: daysAgo(8), meetingName: 'Women in Recovery', location: 'YWCA - 3099 Alabama St', speaker: 'Angela M.', topic: 'Healing Relationships', isVerified: true, notes: null },
    { date: daysAgo(1), meetingName: 'Hope & Recovery', location: 'Community Center - 4500 Main St', speaker: 'Open Share', topic: 'Gratitude', isVerified: true, notes: 'Shared gratitude for family support' },
    { date: daysFromNow(6), meetingName: 'Monday Night Miracles', location: "St. Paul's Church - 2200 Travis", speaker: 'TBD', topic: 'TBD', isVerified: false, notes: 'Upcoming meeting' },
    { date: daysFromNow(13), meetingName: 'Hope & Recovery', location: 'Community Center - 4500 Main St', speaker: 'TBD', topic: 'TBD', isVerified: false, notes: 'Upcoming meeting' },
  ]

  for (const meeting of naMeetingData) {
    await createNAMeeting({ caseId, ...meeting })
  }

  // Supervised Visits
  const visitData = [
    { date: daysAgo(77), location: 'CPS Visitation Center', supervisorName: 'Karen White', duration: 60, childBehavior: 'anxious', parentBehavior: 'nervous', notes: 'Initial visit. Children were shy and anxious. Mother tried her best to engage.', isCompleted: true, visitType: 'supervised' },
    { date: daysAgo(63), location: 'CPS Visitation Center', supervisorName: 'Karen White', duration: 60, childBehavior: 'engaged', parentBehavior: 'engaged', notes: 'Much better engagement. Children opened up more. Mother read a story.', isCompleted: true, visitType: 'supervised' },
    { date: daysAgo(49), location: 'CPS Visitation Center', supervisorName: 'Karen White', duration: 90, childBehavior: 'happy', parentBehavior: 'affectionate', notes: 'Extended visit approved. Great bonding observed. Children excited to see mother.', isCompleted: true, visitType: 'supervised' },
    { date: daysAgo(35), location: "Maternal Grandmother's Home", supervisorName: 'Karen White', duration: 120, childBehavior: 'happy', parentBehavior: 'affectionate', notes: 'In-home visit approved. Very positive interaction. Made lunch together.', isCompleted: true, visitType: 'semi-supervised' },
    { date: daysAgo(21), location: "Maternal Grandmother's Home", supervisorName: 'Karen White', duration: 180, childBehavior: 'happy', parentBehavior: 'engaged', notes: 'Full day visit. Helped with homework, played games. Excellent progress.', isCompleted: true, visitType: 'semi-supervised' },
    { date: daysAgo(7), location: "Maternal Grandmother's Home", supervisorName: 'Karen White', duration: 240, childBehavior: 'happy', parentBehavior: 'engaged', notes: 'Extended full day visit. Routine care activities observed. All positive.', isCompleted: true, visitType: 'semi-supervised' },
    { date: daysFromNow(3), location: "Maternal Grandmother's Home", supervisorName: 'Karen White', duration: 300, childBehavior: null, parentBehavior: null, notes: 'Scheduled - trial unsupervised day visit', isCompleted: false, visitType: 'unsupervised' },
    { date: daysFromNow(10), location: "Maternal Grandmother's Home", supervisorName: 'Karen White', duration: 300, childBehavior: null, parentBehavior: null, notes: 'Scheduled - continued unsupervised visit', isCompleted: false, visitType: 'unsupervised' },
  ]

  for (const visit of visitData) {
    await createSupervisedVisit({ caseId, ...visit })
  }

  // Court Dates
  const courtDateData = [
    { date: new Date('2024-06-18').toISOString(), hearingType: 'emergency', outcome: 'Children removed to kinship care with maternal grandmother', judgeNotes: 'Immediate removal warranted due to substance abuse in home', nextSteps: 'Service plan to be developed within 30 days', isCompleted: true },
    { date: new Date('2024-07-15').toISOString(), hearingType: 'adjudication', outcome: 'Case adjudicated. Service plan approved.', judgeNotes: 'Mother present and cooperative. Service plan includes counseling, NA, drug testing, parenting classes.', nextSteps: 'Review hearing in 90 days', isCompleted: true },
    { date: new Date('2024-10-15').toISOString(), hearingType: 'review', outcome: 'Making satisfactory progress. Continue services.', judgeNotes: 'Mother attending all services. Drug tests clean. Visits going well.', nextSteps: 'Increase visitation if continued progress', isCompleted: true },
    { date: new Date('2025-01-15').toISOString(), hearingType: 'permanency', outcome: 'Progress continues. Goal remains reunification.', judgeNotes: 'All services in compliance. Moving toward semi-supervised visits.', nextSteps: 'Trial unsupervised visits. Review in 90 days.', isCompleted: true },
    { date: daysFromNow(10), hearingType: 'review', outcome: null, judgeNotes: null, nextSteps: null, isCompleted: false },
    { date: new Date('2025-06-15').toISOString(), hearingType: 'final', outcome: null, judgeNotes: null, nextSteps: null, isCompleted: false },
  ]

  for (const court of courtDateData) {
    await createCourtDate({ caseId, ...court })
  }

  // Parenting Classes
  const parentingData = [
    { date: daysAgo(70), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Understanding Child Development', isCompleted: true, hasCertificate: false, notes: 'First session. Overview of developmental milestones.' },
    { date: daysAgo(63), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Positive Discipline Strategies', isCompleted: true, hasCertificate: false, notes: 'Learned alternatives to punitive discipline.' },
    { date: daysAgo(56), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Communication with Children', isCompleted: true, hasCertificate: false, notes: 'Active listening and age-appropriate communication.' },
    { date: daysAgo(49), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Managing Parental Stress', isCompleted: true, hasCertificate: false, notes: 'Self-care and stress management techniques.' },
    { date: daysAgo(42), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Building Routines and Structure', isCompleted: true, hasCertificate: false, notes: 'Creating stable home routines.' },
    { date: daysAgo(35), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Co-Parenting Skills', isCompleted: true, hasCertificate: false, notes: 'Working with co-parents and family members.' },
    { date: daysAgo(28), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Substance Abuse and Parenting', isCompleted: true, hasCertificate: false, notes: 'Impact of addiction on children and recovery parenting.' },
    { date: daysAgo(21), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Safety and Supervision', isCompleted: true, hasCertificate: false, notes: 'Home safety and appropriate supervision by age.' },
    { date: daysAgo(14), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Rebuilding Trust with Children', isCompleted: true, hasCertificate: false, notes: 'Addressing the impact of separation and rebuilding bonds.' },
    { date: daysAgo(7), className: 'Positive Parenting Program (Triple P)', provider: 'Family Services of Houston', topic: 'Course Review and Graduation', isCompleted: true, hasCertificate: true, notes: 'Completed all 10 sessions. Certificate of completion received.' },
  ]

  for (const cls of parentingData) {
    await createParentingClass({ caseId, ...cls })
  }

  // Milestones
  const milestoneData = [
    { title: 'Completed Substance Abuse Assessment', description: 'Initial assessment by Dr. Kim completed and treatment plan established', category: 'recovery', targetDate: daysAgo(80), completedAt: daysAgo(83), isCompleted: true, notes: 'Assessed as moderate substance use disorder' },
    { title: '30 Days Clean', description: 'Maintained 30 consecutive days of sobriety', category: 'recovery', targetDate: daysAgo(54), completedAt: daysAgo(54), isCompleted: true, notes: 'Verified by drug testing' },
    { title: 'Completed Parenting Classes', description: 'Finished the 10-week Positive Parenting Program', category: 'family', targetDate: daysAgo(7), completedAt: daysAgo(7), isCompleted: true, notes: 'Received certificate of completion' },
    { title: '60 Days Clean', description: 'Maintained 60 consecutive days of sobriety', category: 'recovery', targetDate: daysAgo(24), completedAt: daysAgo(24), isCompleted: true, notes: 'All drug tests negative' },
    { title: 'First Semi-Supervised Visit', description: 'Transition from fully supervised to semi-supervised visits', category: 'family', targetDate: daysAgo(35), completedAt: daysAgo(35), isCompleted: true, notes: 'Approved by caseworker and supervisor' },
    { title: 'Completed NA Steps 1-3', description: 'Finished the first three steps of the NA program', category: 'recovery', targetDate: daysAgo(30), completedAt: daysAgo(30), isCompleted: true, notes: 'Verified by sponsor James Martinez' },
    { title: '90 Days Clean', description: 'Maintained 90 consecutive days of sobriety', category: 'recovery', targetDate: null, completedAt: null, isCompleted: false, notes: 'On track - currently at ~85 days clean' },
    { title: 'Trial Unsupervised Visit', description: 'First unsupervised day visit with children', category: 'family', targetDate: daysFromNow(3), completedAt: null, isCompleted: false, notes: 'Pending caseworker approval' },
    { title: 'Complete NA Steps 4-6', description: 'Work through steps 4, 5, and 6 with sponsor', category: 'recovery', targetDate: daysFromNow(60), completedAt: null, isCompleted: false, notes: null },
    { title: 'Stable Housing Established', description: 'Secure appropriate housing for reunification', category: 'housing', targetDate: daysFromNow(90), completedAt: null, isCompleted: false, notes: 'Currently living in recovery housing' },
    { title: 'Steady Employment', description: 'Maintain employment for at least 90 days', category: 'employment', targetDate: daysFromNow(120), completedAt: null, isCompleted: false, notes: 'Currently in job training program' },
    { title: 'Case Closure / Reunification', description: 'Successful completion of all court-ordered services leading to reunification', category: 'legal', targetDate: new Date('2025-06-15').toISOString(), completedAt: null, isCompleted: false, notes: 'Target date aligned with final hearing' },
  ]

  for (const milestone of milestoneData) {
    await createMilestone({ caseId, ...milestone })
  }

  // Case Requirements
  const requirementData = [
    { category: 'counseling', title: 'Individual Counseling', description: 'Weekly individual therapy sessions with licensed counselor', frequency: 'weekly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Ongoing - good attendance', sortOrder: 1 },
    { category: 'counseling', title: 'Family Counseling', description: 'Bi-weekly family therapy sessions', frequency: 'biweekly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Ongoing', sortOrder: 2 },
    { category: 'counseling', title: 'Group Therapy', description: 'Weekly group therapy sessions', frequency: 'weekly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Ongoing', sortOrder: 3 },
    { category: 'drug-testing', title: 'Monthly Drug Test', description: 'Scheduled monthly urine drug screening', frequency: 'monthly', isCompleted: false, completedAt: null, dueDate: null, notes: 'All tests negative to date', sortOrder: 4 },
    { category: 'drug-testing', title: 'Random Drug Testing', description: 'Submit to random drug testing when requested', frequency: 'as-needed', isCompleted: false, completedAt: null, dueDate: null, notes: 'Must be available within 4 hours of notification', sortOrder: 5 },
    { category: 'drug-testing', title: 'Quarterly Hair Follicle Test', description: '90-day hair follicle test every quarter', frequency: 'monthly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Last test negative', sortOrder: 6 },
    { category: 'na-meetings', title: 'Attend NA Meetings', description: 'Attend minimum 3 NA meetings per week', frequency: 'weekly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Currently attending 3-4 per week', sortOrder: 7 },
    { category: 'na-meetings', title: 'Obtain NA Sponsor', description: 'Find and work with an NA sponsor', frequency: 'one-time', isCompleted: true, completedAt: daysAgo(75), dueDate: null, notes: 'Sponsor: James Martinez', sortOrder: 8 },
    { category: 'na-steps', title: 'Complete NA Steps 1-12', description: 'Work through all 12 steps of NA program with sponsor', frequency: 'as-needed', isCompleted: false, completedAt: null, dueDate: new Date('2025-06-01').toISOString(), notes: 'Steps 1-3 completed, Step 4 in progress', sortOrder: 9 },
    { category: 'supervised-visits', title: 'Attend All Scheduled Visits', description: 'Attend all scheduled supervised visitation with children', frequency: 'weekly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Perfect attendance', sortOrder: 10 },
    { category: 'supervised-visits', title: 'Progress to Unsupervised Visits', description: 'Demonstrate appropriate parenting to move to unsupervised visits', frequency: 'one-time', isCompleted: false, completedAt: null, dueDate: daysFromNow(14), notes: 'Trial unsupervised visit scheduled', sortOrder: 11 },
    { category: 'parenting-classes', title: 'Complete Parenting Course', description: 'Complete 10-week Positive Parenting Program', frequency: 'one-time', isCompleted: true, completedAt: daysAgo(7), dueDate: null, notes: 'Certificate received', sortOrder: 12 },
    { category: 'housing', title: 'Secure Appropriate Housing', description: 'Obtain stable housing suitable for children', frequency: 'one-time', isCompleted: false, completedAt: null, dueDate: daysFromNow(90), notes: 'Currently in recovery housing - need 2-bedroom minimum', sortOrder: 13 },
    { category: 'employment', title: 'Obtain Employment', description: 'Secure steady employment or enroll in job training', frequency: 'one-time', isCompleted: false, completedAt: null, dueDate: daysFromNow(60), notes: 'Enrolled in job training program at Workforce Solutions', sortOrder: 14 },
    { category: 'employment', title: 'Maintain Employment', description: 'Maintain employment for minimum 90 days', frequency: 'as-needed', isCompleted: false, completedAt: null, dueDate: daysFromNow(150), notes: 'Pending - depends on obtaining employment first', sortOrder: 15 },
    { category: 'other', title: 'Attend All Court Hearings', description: 'Be present for all scheduled court hearings', frequency: 'as-needed', isCompleted: false, completedAt: null, dueDate: null, notes: 'All hearings attended so far', sortOrder: 16 },
    { category: 'other', title: 'Maintain Contact with Caseworker', description: 'Regular check-ins with assigned caseworker', frequency: 'weekly', isCompleted: false, completedAt: null, dueDate: null, notes: 'Weekly phone check-ins, monthly in-person', sortOrder: 17 },
  ]

  for (const req of requirementData) {
    await createRequirement({ caseId, ...req })
  }

  // Daily Check-ins for past 14 days
  const moods: Array<string> = ['good', 'good', 'great', 'okay', 'good', 'great', 'good', 'okay', 'struggling', 'good', 'great', 'good', 'good', 'great']
  const meetingCounts = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1]
  const checkinNotes = [
    'Good day. Attended morning NA meeting.',
    'Quiet day. Feeling steady.',
    'Great visit with kids today! They were so happy.',
    'A bit tired today but managing okay.',
    'Productive day. Met with job counselor.',
    'Excellent NA meeting. Shared my story.',
    'Rest day. Feeling peaceful.',
    'Normal day. Attended counseling session.',
    'Tough morning but got through it. Reached out to sponsor.',
    'Better today. Kids visit went well.',
    'Wonderful day! Sponsor verified Step 3 completion.',
    'Regular day. Attending meeting tonight.',
    'Feeling strong in recovery. Grateful.',
    'Great week overall. Looking forward to court date.',
  ]

  for (let i = 13; i >= 0; i--) {
    const dayIndex = 13 - i
    await createDailyCheckIn({
      caseId,
      date: daysAgo(i),
      mood: moods[dayIndex],
      drugTestRequired: i === 3 || i === 7,
      drugTestCompleted: i === 3 || i === 7,
      meetingsAttended: meetingCounts[dayIndex],
      notes: checkinNotes[dayIndex],
    })
  }

  return {
    caseId,
    stats: {
      naSteps: 12,
      counselingSessions: counselingData.length,
      drugTests: drugTestData.length,
      naMeetings: naMeetingData.length,
      supervisedVisits: visitData.length,
      courtDates: courtDateData.length,
      parentingClasses: parentingData.length,
      milestones: milestoneData.length,
      requirements: requirementData.length,
      dailyCheckIns: 14,
    },
  }
}

// ============================================================
// Export / Import for backup & restore
// ============================================================

export interface ExportData {
  version: number
  exportedAt: string
  cases: CaseInfo[]
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
}

export async function exportAllData(): Promise<ExportData> {
  const db = await getDB()
  const [cases, requirements, counselingSessions, drugTests, naSteps, naMeetings, supervisedVisits, courtDates, parentingClasses, milestones, dailyCheckIns] = await Promise.all([
    db.getAll('cases') as Promise<CaseInfo[]>,
    db.getAll('requirements') as Promise<CaseRequirement[]>,
    db.getAll('counselingSessions') as Promise<CounselingSession[]>,
    db.getAll('drugTests') as Promise<DrugTest[]>,
    db.getAll('naSteps') as Promise<NAStep[]>,
    db.getAll('naMeetings') as Promise<NAMeeting[]>,
    db.getAll('supervisedVisits') as Promise<SupervisedVisit[]>,
    db.getAll('courtDates') as Promise<CourtDate[]>,
    db.getAll('parentingClasses') as Promise<ParentingClass[]>,
    db.getAll('milestones') as Promise<Milestone[]>,
    db.getAll('dailyCheckIns') as Promise<DailyCheckIn[]>,
  ])

  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    cases,
    requirements,
    counselingSessions,
    drugTests,
    naSteps,
    naMeetings,
    supervisedVisits,
    courtDates,
    parentingClasses,
    milestones,
    dailyCheckIns,
  }
}

export async function importAllData(data: ExportData): Promise<void> {
  // Clear existing data first
  await clearAllData()

  const db = await getDB()

  // Import each store
  const storeNames: { name: StoreName; items: unknown[] }[] = [
    { name: 'cases', items: data.cases },
    { name: 'requirements', items: data.requirements },
    { name: 'counselingSessions', items: data.counselingSessions },
    { name: 'drugTests', items: data.drugTests },
    { name: 'naSteps', items: data.naSteps },
    { name: 'naMeetings', items: data.naMeetings },
    { name: 'supervisedVisits', items: data.supervisedVisits },
    { name: 'courtDates', items: data.courtDates },
    { name: 'parentingClasses', items: data.parentingClasses },
    { name: 'milestones', items: data.milestones },
    { name: 'dailyCheckIns', items: data.dailyCheckIns },
  ]

  for (const { name, items } of storeNames) {
    if (items && items.length > 0) {
      const tx = db.transaction(name, 'readwrite')
      for (const item of items) {
        await tx.store.put(item)
      }
      await tx.done
    }
  }
}

// ============================================================
// Query invalidation event system
// ============================================================

const INVALIDATION_EVENT = 'reunify-db-invalidated'

export function invalidateQueries(keys?: string[]): void {
  // Dispatch a custom event so React Query hooks know to refetch
  window.dispatchEvent(new CustomEvent(INVALIDATION_EVENT, { detail: { keys } }))
}

export function onInvalidate(callback: (keys?: string[]) => void): () => void {
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent
    callback(customEvent.detail?.keys)
  }
  window.addEventListener(INVALIDATION_EVENT, handler)
  return () => window.removeEventListener(INVALIDATION_EVENT, handler)
}
