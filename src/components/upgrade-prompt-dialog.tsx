'use client'

import { useAppStore } from '@/lib/store'
import { getCategoryDisplayName, FREE_TIER_LIMITS } from '@/lib/free-tier'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Crown, Sparkles } from 'lucide-react'

interface UpgradePromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: string
}

export function UpgradePromptDialog({ open, onOpenChange, category }: UpgradePromptDialogProps) {
  const { setActiveView } = useAppStore()
  const displayName = getCategoryDisplayName(category)
  const limit = FREE_TIER_LIMITS[category] ?? 5

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Crown className="size-4 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-lg">Great Progress!</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-2">
            <span className="block">
              You&apos;ve logged {limit} {displayName}! That&apos;s great progress!
            </span>
            <span className="block">
              Upgrade to Pro to track unlimited items and get access to backup, PDF reports, and more.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="outline" className="sm:mr-auto">
              Continue with {limit} items
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 gap-2"
              onClick={() => {
                onOpenChange(false)
                setActiveView('go-pro')
              }}
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
