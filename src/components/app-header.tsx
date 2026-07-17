'use client'

import { Plus } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useAppStore, VIEW_LABELS, type ViewType } from '@/lib/store'
import { useCase } from '@/lib/data-hooks'

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
  const { activeView, activeCaseId, triggerAddDialog } = useAppStore()
  const title = VIEW_LABELS[activeView]
  const { data: caseData } = useCase(activeCaseId)
  const addLabel = VIEW_ADD_LABELS[activeView]

  // Calculate overall progress from requirements
  const requirements = caseData?.requirements ?? []
  const completedReqs = requirements.filter(r => r.isCompleted).length
  const totalReqs = requirements.length
  const overallProgress = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 transition-[width,height] ease-linear">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-base font-semibold text-foreground flex-1">
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

      {activeCaseId && addLabel && (
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={triggerAddDialog}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">{addLabel}</span>
        </Button>
      )}
    </header>
  )
}
