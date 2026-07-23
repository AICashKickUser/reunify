'use client'

import { useEffect, lazy, Suspense, useState } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { useAppStore, VIEW_LABELS, type ViewType } from '@/lib/store'
import { useCases, useSeedDatabase } from '@/lib/data-hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderHeart, Eye, Loader2, FileText, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react'
import { CreateCaseDialog } from '@/components/create-case-dialog'
import { UpgradeDialog } from '@/components/upgrade-dialog'
import { OnboardingDialog } from '@/components/onboarding-dialog'
import { useSubscriptionStore } from '@/lib/subscription'
import { ErrorBoundary } from '@/components/error-boundary'
import { toast } from 'sonner'
import { useNavigationHistory } from '@/hooks/use-navigation-history'

// Safe lazy load helper - catches import errors
function safeLazy<T extends React.ComponentType>(
  importFn: () => Promise<{ [key: string]: T }>,
  exportName: string
) {
  return lazy(async () => {
    try {
      const mod = await importFn()
      return { default: mod[exportName] }
    } catch (error) {
      console.error(`Failed to load view ${exportName}:`, error)
      // Return a fallback component instead of crashing
      return {
        default: () => (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30 mb-4">
              <AlertTriangle className="size-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load view</h3>
            <p className="text-muted-foreground text-sm text-center max-w-sm">
              There was an error loading this section. Please try refreshing the page.
            </p>
          </div>
        ) as unknown as T
      }
    }
  })
}

const DashboardView = safeLazy(() => import('@/components/views/dashboard-view'), 'DashboardView')
const TimelineView = safeLazy(() => import('@/components/views/timeline-view'), 'TimelineView')
const CasePlanView = safeLazy(() => import('@/components/views/case-plan-view'), 'CasePlanView')
const CounselingView = safeLazy(() => import('@/components/views/counseling-view'), 'CounselingView')
const DrugTestingView = safeLazy(() => import('@/components/views/drug-testing-view'), 'DrugTestingView')
const NAStepsView = safeLazy(() => import('@/components/views/na-steps-view'), 'NAStepsView')
const NAMeetingsView = safeLazy(() => import('@/components/views/na-meetings-view'), 'NAMeetingsView')
const SupervisedVisitsView = safeLazy(() => import('@/components/views/supervised-visits-view'), 'SupervisedVisitsView')
const CourtDatesView = safeLazy(() => import('@/components/views/court-dates-view'), 'CourtDatesView')
const ParentingClassesView = safeLazy(() => import('@/components/views/parenting-classes-view'), 'ParentingClassesView')
const ProgressView = safeLazy(() => import('@/components/views/progress-view'), 'ProgressView')
const DailyCheckinsView = safeLazy(() => import('@/components/views/daily-checkins-view'), 'DailyCheckinsView')
const GoProView = safeLazy(() => import('@/components/views/go-pro-view'), 'GoProView')
const BackupView = safeLazy(() => import('@/components/views/backup-view'), 'BackupView')

const VIEW_MAP: Record<ViewType, React.ComponentType> = {
  'dashboard': DashboardView,
  'timeline': TimelineView,
  'case-plan': CasePlanView,
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

function WelcomeScreen() {
  const { setActiveCaseId } = useAppStore()
  const { data: cases, isLoading } = useCases()
  const seedMutation = useSeedDatabase()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (cases && cases.length > 0) {
      setActiveCaseId(cases[0].id)
    }
  }, [cases, setActiveCaseId])

  if (isLoading) {
    return <ViewLoader />
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <FolderHeart className="size-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome to Reunify
          </h2>
          <p className="text-muted-foreground">
            Track your CPS reunification case plan progress. Stay organized, stay focused, and bring your kids home.
          </p>
        </div>

        {/* Primary Action: Create Your Case */}
        <Card className="text-left border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">Set Up Your Case</CardTitle>
            <CardDescription>Enter your case details to start tracking your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your case plan details will help you stay on top of every requirement — from counseling sessions and drug tests to supervised visits and court dates.
            </p>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base"
              onClick={() => setCreateDialogOpen(true)}
            >
              <FileText className="size-5 mr-1" />
              Create My Case
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        {/* Divider: Just exploring? */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground/70">Just exploring?</span>
          </div>
        </div>

        {/* Secondary Action: Load Demo */}
        <Card className="text-left border-dashed">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Load a sample case with realistic data to explore how Reunify works — this is not real data.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                seedMutation.mutate()
              }}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Eye className="size-4" />
              )}
              {seedMutation.isPending ? 'Loading Demo Case...' : 'Explore with Demo Data'}
            </Button>
          </CardContent>
        </Card>

        <CreateCaseDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Go Pro Card */}
        <Card className="text-left border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:border-amber-800 dark:from-amber-950/20 dark:to-yellow-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Pro</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  Unlock advanced reporting, data export, and more with a 7-day free trial
                </p>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0"
              onClick={() => useAppStore.getState().setActiveView('go-pro')}
            >
              <Sparkles className="size-4" />
              See Pro Features
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-emerald-600">100%</p>
            <p className="text-xs text-muted-foreground">Case Plan Tracking</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-amber-600">24/7</p>
            <p className="text-xs text-muted-foreground">Stay Organized</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-rose-600">1</p>
            <p className="text-xs text-muted-foreground">Goal: Reunification</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActiveView() {
  const { activeView } = useAppStore()
  const ViewComponent = VIEW_MAP[activeView]

  if (!ViewComponent) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertTriangle className="size-12 text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">View not found</h3>
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

export default function Home() {
  const { activeCaseId, activeView } = useAppStore()
  const { setTier, setSubscriptionData } = useSubscriptionStore()

  // Enable browser history management for Android back button support
  useNavigationHistory()

  // Handle Stripe checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutStatus = params.get('checkout')
    const sessionId = params.get('session_id')

    if (checkoutStatus === 'success' && sessionId) {
      // Verify the session with our backend
      fetch('/api/stripe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'active' && data.subscription) {
            setSubscriptionData({
              tier: 'pro',
              stripeSessionId: sessionId,
              subscriptionStatus: data.subscription.status,
              trialEnd: data.subscription.trialEnd,
              currentPeriodEnd: data.subscription.currentPeriodEnd,
              cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd,
            })
            toast.success('Welcome to Reunify Pro! 🎉', {
              description: 'Your 7-day free trial has started. Enjoy all Pro features!',
            })
          } else {
            toast.info('Subscription is being processed', {
              description: 'Your payment is being verified. Pro features will unlock shortly!',
            })
          }
        })
        .catch(() => {
          toast.info('Subscription is being processed', {
            description: 'Your payment is being verified. Pro features will unlock shortly!',
          })
        })

      // Clean up URL but preserve history state
      window.history.replaceState({ view: 'dashboard', timestamp: Date.now() }, '', '/#dashboard')
    } else if (checkoutStatus === 'cancel') {
      toast.info('Checkout canceled', {
        description: 'No worries — you can upgrade anytime!',
      })
      window.history.replaceState({ view: 'go-pro', timestamp: Date.now() }, '', '/#go-pro')
    }
  }, [setTier, setSubscriptionData])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 overflow-hidden">
            <div className="p-4 md:p-6 h-full overflow-y-auto">
              {activeView === 'go-pro' ? (
                <ActiveView />
              ) : activeCaseId ? (
                <ActiveView />
              ) : (
                <WelcomeScreen />
              )}
            </div>
          </main>
          <footer className="border-t bg-background py-3 px-4 mt-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1 max-w-5xl mx-auto">
              <p className="text-xs text-muted-foreground">
                Reunify — Every step brings you closer to your kids
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
      <UpgradeDialog />
      <OnboardingDialog />
    </SidebarProvider>
  )
}
