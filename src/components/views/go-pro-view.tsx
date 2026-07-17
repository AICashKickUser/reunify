'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Check, Sparkles } from 'lucide-react'
import { useSubscriptionStore, PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY } from '@/lib/subscription'
import { toast } from 'sonner'

type BillingPeriod = 'monthly' | 'yearly'

export function GoProView() {
  const { tier, setTier, setUpgradeDialogOpen } = useSubscriptionStore()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly')
  const [upgrading, setUpgrading] = useState(false)

  const isPro = tier === 'pro'
  const price = billingPeriod === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY
  const periodLabel = billingPeriod === 'monthly' ? '/month' : '/year'
  const savingsPercent = Math.round((1 - PRO_PRICE_YEARLY / (PRO_PRICE_MONTHLY * 12)) * 100)

  async function handleUpgrade() {
    setUpgrading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setTier('pro')
    setUpgrading(false)
    toast.success('Welcome to Reunify Pro! 🎉', {
      description: 'You now have access to all Pro features.',
    })
  }

  if (isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-4">
          <Crown className="size-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">You&apos;re a Pro Member!</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You have access to all Pro features. Keep making progress on your reunification journey!
        </p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg w-full">
          {PRO_FEATURES.slice(0, 4).map((f) => (
            <div key={f.key} className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
              <Check className="size-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs font-medium">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mx-auto">
          <Crown className="size-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Upgrade to Reunify Pro</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Unlock powerful tools to track, report, and share your reunification journey
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-emerald-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
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
      <div className="text-center">
        <span className="text-4xl font-bold text-foreground">${price}</span>
        <span className="text-muted-foreground">{periodLabel}</span>
        {billingPeriod === 'yearly' && (
          <p className="text-xs text-muted-foreground mt-1">
            Just ${(PRO_PRICE_YEARLY / 12).toFixed(2)}/month, billed annually
          </p>
        )}
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            Everything in Free, plus:
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PRO_FEATURES.map((feature) => (
            <div key={feature.key} className="flex items-start gap-3">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mt-0.5">
                <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-3">
        <Button
          className="w-full max-w-sm h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold gap-2"
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
        <p className="text-xs text-muted-foreground">
          Cancel anytime. Your data stays yours.
        </p>
      </div>
    </div>
  )
}
