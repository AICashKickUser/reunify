'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { useAppStore, type ViewType } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import { OnboardingDialog } from '@/components/onboarding-dialog'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { ErrorBoundary } from '@/components/error-boundary'
import { toast } from 'sonner'
import { useNavigationHistory } from '@/hooks/use-navigation-history'
import { AppLockScreen, useAppLock } from '@/components/app-lock'
import { CelebrationOverlay } from '@/components/celebration-overlay'
import { useAutoBackup } from '@/hooks/use-auto-backup'
import { useCases } from '@/lib/data-hooks'
import { UpgradeDialog } from '@/components/upgrade-dialog'

/**
 * Auto-detects existing cases and sets the activeCaseId if none is set.
 * This prevents the app from showing the onboarding wizard when there's
 * already a case in the database.
 */
function useAutoSelectCase() {
  const { activeCaseId, setActiveCaseId } = useAppStore()
  const { data: cases } = useCases()

  useEffect(() => {
    // Only auto-select if no activeCaseId is set and we have cases
    if (!activeCaseId && cases && cases.length > 0) {
      setActiveCaseId(cases[0].id)
    }
  }, [activeCaseId, cases, setActiveCaseId])
}

// All views use standard lazy() with default exports
// This avoids ChunkLoadError on Vercel's CDN that safeLazy+named exports caused
const DashboardView = lazy(() => import('@/components/views/dashboard-view'))
const TimelineView = lazy(() => import('@/components/views/timeline-view'))
const CasePlanView = lazy(() => import('@/components/views/case-plan-view'))
const ScanCasePlanView = lazy(() => import('@/components/views/scan-case-plan-view'))
const CounselingView = lazy(() => import('@/components/views/counseling-view'))
const DrugTestingView = lazy(() => import('@/components/views/drug-testing-view'))
const NAStepsView = lazy(() => import('@/components/views/na-steps-view'))
const NAMeetingsView = lazy(() => import('@/components/views/na-meetings-view'))
const SupervisedVisitsView = lazy(() => import('@/components/views/supervised-visits-view'))
const CourtDatesView = lazy(() => import('@/components/views/court-dates-view'))
const ParentingClassesView = lazy(() => import('@/components/views/parenting-classes-view'))
const ProgressView = lazy(() => import('@/components/views/progress-view'))
const DailyCheckinsView = lazy(() => import('@/components/views/daily-checkins-view'))
const BackupView = lazy(() => import('@/components/views/backup-view'))
const GoProView = lazy(() => import('@/components/views/go-pro-view'))

const VIEW_MAP: Record<ViewType, React.ComponentType> = {
  'dashboard': DashboardView,
  'timeline': TimelineView,
  'case-plan': CasePlanView,
  'scan-case-plan': ScanCasePlanView,
  'counseling': CounselingView,
  'drug-testing': DrugTestingView,
  'na-steps': NAStepsView,
  'na-meetings': NAMeetingsView,
  'supervised-visits': SupervisedVisitsView,
  'court-dates': CourtDatesView,
  'parenting-classes': ParentingClassesView,
  'daily-checkins': DailyCheckinsView,
  'progress': ProgressView,
  'backup': BackupView,
  'go-pro': GoProView,
}

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-8 animate-spin text-emerald-600" />
    </div>
  )
}



function ActiveView() {
  const { activeView } = useAppStore()
  const ViewComponent = VIEW_MAP[activeView]

  if (!ViewComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-muted-foreground text-sm">Please select a different view from the sidebar.</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<ViewLoader />}>
        <ViewComponent />
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * Hook that listens for the 'reunify-show-upgrade' custom event
 * and opens the UpgradeDialog.
 */
function useUpgradeDialog() {
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>()

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      setUpgradeFeature(customEvent.detail?.feature)
      setUpgradeOpen(true)
    }
    window.addEventListener('reunify-show-upgrade', handler)
    return () => window.removeEventListener('reunify-show-upgrade', handler)
  }, [])

  return { upgradeOpen, setUpgradeOpen, upgradeFeature }
}

export default function Home() {
  const { activeCaseId, activeView } = useAppStore()
  const { isUnlocked, handleUnlock, mounted } = useAppLock()
  const { upgradeOpen, setUpgradeOpen, upgradeFeature } = useUpgradeDialog()

  // Enable browser history management for Android back button support
  useNavigationHistory()

  // Enable auto-backup for Pro users
  useAutoBackup()

  // Auto-select existing case so the app doesn't show onboarding when data exists
  useAutoSelectCase()

  // Show lock screen if app lock is enabled and not yet unlocked
  if (mounted && !isUnlocked) {
    return <AppLockScreen onUnlock={handleUnlock} />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 overflow-hidden">
            <div className="p-3 md:p-6 h-full overflow-y-auto overflow-x-hidden">
              {activeCaseId ? (
                <ActiveView />
              ) : (
                <OnboardingWizard />
              )}
            </div>
          </main>
          <footer className="border-t bg-background py-2 sm:py-3 px-3 sm:px-4 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 max-w-5xl mx-auto">
              <p className="text-xs text-muted-foreground">
                Reunify v1.7.0 — Every step brings you closer to your kids
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <span>·</span>
                <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
              </div>
            </div>
          </footer>
        </div>
      </SidebarInset>
      <OnboardingDialog />
      <CelebrationOverlay />
      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        feature={upgradeFeature}
      />
    </SidebarProvider>
  )
}
