'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Check, Sparkles, ExternalLink, AlertCircle } from 'lucide-react'
import { useSubscriptionStore, PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, BillingPeriod } from '@/lib/subscription'
import { toast } from 'sonner'

export function GoProView() {
  const { tier, setTier, setSubscriptionData, stripeSessionId, cancelAtPeriodEnd, currentPeriodEnd, isTrial, trialEnd } = useSubscriptionStore()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly')
  const [upgrading, setUpgrading] = useState(false)
  const [managing, setManaging] = useState(false)

  const isPro = tier === 'pro'
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
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else if (data.error) {
        if (res.status === 503) {
          toast.error('Payment setup in progress', {
            description: 'We\'re setting up payment processing. Please try again soon!',
          })
        } else {
          toast.error('Something went wrong', { description: data.error })
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

  async function handleManageSubscription() {
    if (!stripeSessionId) {
      toast.error('No active subscription found', {
        description: 'Your Pro access may be from a free trial.',
      })
      return
    }

    setManaging(true)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: stripeSessionId }),
      })

      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Could not open billing portal', { description: data.error })
      }
    } catch {
      toast.error('Network error', { description: 'Please try again.' })
    } finally {
      setManaging(false)
    }
  }

  // Pro member view
  if (isPro) {
    const trialActive = isTrial()
    const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toLocaleDateString() : null

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-4">
          <Crown className="size-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">You&apos;re a Pro Member!</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You have access to all Pro features. Keep making progress on your reunification journey!
        </p>

        {/* Subscription status info */}
        <div className="mt-4 text-center space-y-1">
          {trialActive && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <Sparkles className="size-3.5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Free Trial — {trialEnd ? `${Math.ceil((trialEnd - Date.now() / 1000) / 86400)} days left` : 'Active'}
              </span>
            </div>
          )}
          {cancelAtPeriodEnd && periodEnd && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <AlertCircle className="size-3.5 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Cancels on {periodEnd}
              </span>
            </div>
          )}
        </div>

        {/* Manage subscription */}
        {stripeSessionId && (
          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={handleManageSubscription}
            disabled={managing}
          >
            <ExternalLink className="size-4" />
            {managing ? 'Opening...' : 'Manage Subscription'}
          </Button>
        )}

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

  // Upgrade view
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
            <span className="animate-pulse">Redirecting to checkout...</span>
          ) : (
            <>
              <Sparkles className="size-4" />
              Start 7-Day Free Trial
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          7-day free trial, then {billingPeriod === 'monthly' ? `$${PRO_PRICE_MONTHLY}/month` : `$${PRO_PRICE_YEARLY}/year`}. Cancel anytime.
        </p>
      </div>
    </div>
  )
}
