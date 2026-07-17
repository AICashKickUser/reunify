'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Check, Sparkles } from 'lucide-react'
import { useSubscriptionStore, PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from '@/lib/subscription'
import { toast } from 'sonner'

type BillingPeriod = 'monthly' | 'yearly'

export function UpgradeDialog() {
  const { upgradeDialogOpen, setUpgradeDialogOpen, setTier, tier } = useSubscriptionStore()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly')
  const [upgrading, setUpgrading] = useState(false)

  const price = billingPeriod === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY
  const periodLabel = billingPeriod === 'monthly' ? '/month' : '/year'
  const savingsPercent = Math.round((1 - PRO_PRICE_YEARLY / (PRO_PRICE_MONTHLY * 12)) * 100)

  async function handleUpgrade() {
    setUpgrading(true)
    // Simulate a brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 800))
    setTier('pro')
    setUpgrading(false)
    setUpgradeDialogOpen(false)
    toast.success('Welcome to Reunify Pro! 🎉', {
      description: 'You now have access to all Pro features.',
    })
  }

  return (
    <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center items-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-2">
            <Crown className="size-8 text-white" />
          </div>
          <DialogTitle className="text-xl">
            Upgrade to Reunify Pro
          </DialogTitle>
          <DialogDescription className="text-sm">
            Unlock powerful tools to track, report, and share your reunification journey
          </DialogDescription>
        </DialogHeader>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              billingPeriod === 'yearly'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Yearly
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 hover:bg-amber-100">
              Save {savingsPercent}%
            </Badge>
          </button>
        </div>

        {/* Price */}
        <div className="text-center mt-1">
          <span className="text-3xl font-bold text-foreground">${price}</span>
          <span className="text-muted-foreground text-sm">{periodLabel}</span>
          {billingPeriod === 'yearly' && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Just ${(PRO_PRICE_YEARLY / 12).toFixed(2)}/month, billed annually
            </p>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-2.5 mt-3">
          {PRO_FEATURES.map((feature) => (
            <div key={feature.key} className="flex items-start gap-2.5">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">{feature.label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-5 space-y-2">
          {tier === 'pro' ? (
            <div className="text-center py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <Sparkles className="size-4" />
                You&apos;re already a Pro member!
              </p>
            </div>
          ) : (
            <>
              <Button
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold gap-2"
                onClick={handleUpgrade}
                disabled={upgrading}
              >
                {upgrading ? (
                  <span className="animate-pulse">Activating...</span>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Start Free Trial
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Cancel anytime. Your data stays yours.
              </p>
            </>
          )}

          {tier !== 'pro' && (
            <button
              onClick={() => setUpgradeDialogOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Maybe Later
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
