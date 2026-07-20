'use client'

import { Plus, Sparkles, ArrowLeft } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAppStore, VIEW_LABELS, type ViewType } from '@/lib/store'
import { useCase } from '@/lib/data-hooks'
import { useSubscriptionStore } from '@/lib/subscription'
import { ProBadge } from '@/components/pro-badge'

const VIEW_ADD_LABELS: Partial<Record<ViewType, string>> = {
  'counseling': 'Add Session',
  'drug-testing': 'Log Test',
  'na-steps': 'Add Step',
  'na-meetings': 'Add Meeting',
  'supervised-visits': 'Add Visit',
  'court-dates': 'Add Court Date',
  'parenting-classes': 'Add Class',
  'case-plan': 'Add Requirement',
  'daily-checkins': 'Check In',
}

export function AppHeader() {
  const { activeView, activeCaseId, triggerAddDialog, setActiveView, viewHistory, goBack } = useAppStore()
  const title = VIEW_LABELS[activeView]
  const { data: caseData } = useCase(activeCaseId)
  const addLabel = VIEW_ADD_LABELS[activeView]
  const { tier, setUpgradeDialogOpen } = useSubscriptionStore()
  const isPro = tier === 'pro'
  const canGoBack = viewHistory.length > 0

  // Calculate overall progress from requirements
  const requirements = caseData?.requirements ?? []
  const completedReqs = requirements.filter(r => r.isCompleted).length
  const totalReqs = requirements.length
  const overallProgress = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 sm:gap-2 border-b bg-background px-2 sm:px-4 transition-[width,height] ease-linear">
      {/* Back button - shown when there's history to go back to */}
      {canGoBack ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => {
            goBack()
            // Also go back in browser history to stay in sync
            window.history.back()
          }}
          aria-label="Go back"
        >
          <ArrowLeft className="size-4" />
        </Button>
      ) : (
        <SidebarTrigger className="-ml-1" />
      )}
      <Separator orientation="vertical" className="mr-1 sm:mr-2 h-4" />
      <h1 className="text-sm sm:text-base font-semibold text-foreground flex-1 truncate">
        {title}
      </h1>

      {activeCaseId && (
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Progress
          </span>
          <Progress value={overallProgress} className="h-2 w-24" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            {overallProgress}%
          </span>
        </div>
      )}

      {isPro ? (
        <ProBadge />
      ) : (
        <Button 
          size="sm" 
          className="gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-sm"
          onClick={() => setActiveView('go-pro')}
        >
          <Sparkles className="size-3.5" />
          <span className="hidden xs:inline sm:inline">Go Pro</span>
        </Button>
      )}

      {activeCaseId && addLabel && (
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={triggerAddDialog}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{addLabel}</span>
        </Button>
      )}
    </header>
  )
}
