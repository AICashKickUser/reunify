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
import { Crown, Check, Sparkles, Key } from 'lucide-react'
import { useSubscriptionStore, PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, BillingPeriod } from '@/lib/subscription'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function UpgradeDialog() {
  const { upgradeDialogOpen, setUpgradeDialogOpen, setTier, setSubscriptionData, tier } = useSubscriptionStore()
  const { setActiveView } = useAppStore()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly')
  const [upgrading, setUpgrading] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [showActivation, setShowActivation] = useState(false)
  const [activating, setActivating] = useState(false)

  const price = billingPeriod === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY
  const periodLabel = billingPeriod === 'monthly' ? '/month' : '/year'
  const savingsPercent = Math.round((1 - PRO_PRICE_YEARLY / (PRO_PRICE_MONTHLY * 12)) * 100)

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingPeriod }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        if (res.status === 503) {
          toast.error('Payment setup in progress', {
            description: data.detail || 'We\'re setting up payment processing. Please try again soon!',
            duration: 8000,
          })
        } else {
          toast.error(data.error, {
            description: data.detail || 'Please try again or contact support.',
            duration: 8000,
          })
        }
      }
    } catch {
      toast.error('Connection error', {
        description: 'Please check your internet connection and try again.',
      })
    } finally {
      setUpgrading(false)
    }
  }

  async function handleActivation() {
    setActivating(true)
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activationCode }),
      })
      const data = await res.json()

      if (data.valid) {
        setSubscriptionData({
          tier: data.tier,
          stripeSessionId: data.stripeSessionId,
          subscriptionStatus: data.subscriptionStatus,
          trialEnd: null,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        })
        toast.success('Pro activated!', {
          description: `You now have full access to all Pro features via ${data.label}.`,
        })
        setActivationCode('')
        setShowActivation(false)
        setUpgradeDialogOpen(false)
      } else {
        toast.error('Invalid activation code', {
          description: data.error || 'Please check the code and try again.',
        })
      }
    } catch {
      toast.error('Connection error', {
        description: 'Please check your internet connection and try again.',
      })
    } finally {
      setActivating(false)
    }
  }

  function handleGoToProPage() {
    setUpgradeDialogOpen(false)
    setActiveView('go-pro')
  }

  return (
    <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
          {PRO_FEATURES.slice(0, 4).map((feature) => (
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
                  <span className="animate-pulse">Redirecting to checkout...</span>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Start 7-Day Free Trial
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                7-day free trial, then {billingPeriod === 'monthly' ? `$${PRO_PRICE_MONTHLY}/month` : `$${PRO_PRICE_YEARLY}/year`}. Cancel anytime.
              </p>
            </>
          )}

          {tier !== 'pro' && (
            <>
              {/* Activation Code Section */}
              <div className="pt-2">
                {!showActivation ? (
                  <button
                    onClick={() => setShowActivation(true)}
                    className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors py-2"
                  >
                    <Key className="size-3" />
                    Have an activation code?
                  </button>
                ) : (
                  <div className="rounded-lg border border-dashed border-emerald-300 dark:border-emerald-700 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="size-4 text-emerald-600" />
                      <p className="text-sm font-medium">Enter Activation Code</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={activationCode}
                        onChange={(e) => setActivationCode(e.target.value)}
                        placeholder="Enter your code"
                        className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleActivation() }}
                      />
                      <Button size="sm" onClick={handleActivation} disabled={activating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        {activating ? '...' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Maybe Later - more prominent */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  onClick={() => setUpgradeDialogOpen(false)}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleGoToProPage}
                  className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                >
                  View full Pro page →
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
