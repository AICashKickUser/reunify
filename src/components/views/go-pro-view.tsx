'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Check, Sparkles, ExternalLink, AlertCircle, AlertTriangle, RefreshCw, ArrowLeft, Key } from 'lucide-react'
import { useSubscriptionStore, PRO_FEATURES, PRO_PRICE_MONTHLY, PRO_PRICE_YEARLY, BillingPeriod } from '@/lib/subscription'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface StripeConfig {
  configured: boolean
  details: {
    stripeKey: string
    monthlyPrice: string
    yearlyPrice: string
    publicUrl: string
  }
  missing: string[]
}

export function GoProView() {
  const { tier, setTier, setSubscriptionData, stripeSessionId, cancelAtPeriodEnd, currentPeriodEnd, isTrial, trialEnd } = useSubscriptionStore()
  const { goBack, viewHistory } = useAppStore()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('yearly')
  const [upgrading, setUpgrading] = useState(false)
  const [managing, setManaging] = useState(false)
  const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false)
  const [activationCode, setActivationCode] = useState('')
  const [showActivation, setShowActivation] = useState(false)

  useEffect(() => {
    checkConfig()
  }, [])

  const checkConfig = useCallback(async () => {
    setConfigLoading(true)
    const isManualRecheck = hasCheckedOnce
    try {
      const res = await fetch('/api/stripe/config')
      const data = await res.json()
      setStripeConfig(data)
      
      if (data.configured) {
        if (isManualRecheck) {
          toast.success('Stripe is configured!', {
            description: 'Payment is ready. You can now upgrade to Pro!',
          })
        }
      } else if (isManualRecheck && data.missing && data.missing.length > 0) {
        toast.info('Still not configured', {
          description: `Missing: ${data.missing.join(', ')}. Make sure you've redeployed on Vercel after adding env vars.`,
          duration: 8000,
        })
      }
    } catch {
      setStripeConfig({ configured: false, details: { stripeKey: 'ERROR', monthlyPrice: 'ERROR', yearlyPrice: 'ERROR', publicUrl: 'ERROR' }, missing: ['Could not check config'] })
    } finally {
      setConfigLoading(false)
      setHasCheckedOnce(true)
    }
  }, [hasCheckedOnce])

  // Owner activation code handler
  function handleActivation() {
    // The activation code is "reunify-owner-2024" - this lets the developer use Pro features
    if (activationCode === 'reunify-owner-2024') {
      setSubscriptionData({
        tier: 'pro',
        stripeSessionId: 'owner-activation',
        subscriptionStatus: 'active',
        trialEnd: null,
        currentPeriodEnd: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year from now
        cancelAtPeriodEnd: false,
      })
      toast.success('Pro activated!', {
        description: 'You now have full access to all Pro features.',
      })
      setActivationCode('')
      setShowActivation(false)
    } else {
      toast.error('Invalid activation code', {
        description: 'Please check the code and try again.',
      })
    }
  }

  const isPro = tier === 'pro'
  const price = billingPeriod === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_YEARLY
  const periodLabel = billingPeriod === 'monthly' ? '/month' : '/year'
  const savingsPercent = Math.round((1 - PRO_PRICE_YEARLY / (PRO_PRICE_MONTHLY * 12)) * 100)

  async function handleUpgrade() {
    if (stripeConfig && !stripeConfig.configured) {
      toast.error('Payment not set up yet', {
        description: `Missing: ${stripeConfig.missing.join(', ')}. These need to be configured in your Vercel dashboard.`,
        duration: 8000,
      })
      return
    }

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

  async function handleManageSubscription() {
    if (!stripeSessionId) {
      toast.error('No active subscription found', {
        description: 'Your Pro access may be from a free trial.',
      })
      return
    }

    // If owner-activated, just show info
    if (stripeSessionId === 'owner-activation') {
      toast.info('Owner access', {
        description: 'Your Pro access was activated with an owner code. No subscription to manage.',
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
    const isOwner = stripeSessionId === 'owner-activation'

    return (
      <div className="flex flex-col items-center justify-center py-6 sm:py-12 px-4">
        <div className="flex size-14 sm:size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mb-3 sm:mb-4">
          <Crown className="size-7 sm:size-10 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">You&apos;re a Pro Member!</h2>
        <p className="text-muted-foreground text-center max-w-md text-sm sm:text-base">
          You have access to all Pro features. Keep making progress on your reunification journey!
        </p>

        {/* Subscription status info */}
        <div className="mt-3 sm:mt-4 text-center space-y-1">
          {isOwner && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <Key className="size-3.5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Owner Access — Full Pro
              </span>
            </div>
          )}
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
        {stripeSessionId && !isOwner && (
          <Button
            variant="outline"
            className="mt-3 sm:mt-4 gap-2"
            onClick={handleManageSubscription}
            disabled={managing}
          >
            <ExternalLink className="size-4" />
            {managing ? 'Opening...' : 'Manage Subscription'}
          </Button>
        )}

        <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-lg w-full">
          {PRO_FEATURES.slice(0, 4).map((f) => (
            <div key={f.key} className="text-center p-2 sm:p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
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
    <div className="max-w-2xl mx-auto py-3 sm:py-6 space-y-4 sm:space-y-6 px-2 sm:px-4 overflow-y-auto">
      {/* Back button for mobile */}
      {viewHistory.length > 0 && (
        <button
          onClick={() => { goBack(); window.history.back() }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      )}

      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="flex size-14 sm:size-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg mx-auto">
          <Crown className="size-7 sm:size-10 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Upgrade to Reunify Pro</h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
          Unlock powerful tools to track, report, and share your reunification journey
        </p>
      </div>

      {/* Config Warning with Setup Guide */}
      {!configLoading && stripeConfig && !stripeConfig.configured && (
        <Card className="border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="space-y-1 sm:space-y-2">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Payment setup incomplete
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-400">
                  The following need to be configured before accepting payments:
                </p>
              </div>
            </div>

            {/* Missing variables list */}
            <div className="space-y-1.5 sm:space-y-2">
              {stripeConfig.missing.map((m) => (
                <div key={m} className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-orange-100/80 dark:bg-orange-900/30">
                  <span className="text-xs font-mono font-medium text-orange-800 dark:text-orange-300">{m}</span>
                  {m === 'STRIPE_SECRET_KEY' && (
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 ml-auto">sk_test_... or sk_live_...</span>
                  )}
                  {m === 'STRIPE_PRICE_MONTHLY_ID' && (
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 ml-auto">price_...</span>
                  )}
                  {m === 'STRIPE_PRICE_YEARLY_ID' && (
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 ml-auto">price_...</span>
                  )}
                </div>
              ))}
            </div>

            {/* Refresh button - uses useCallback to prevent full page reload */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/50"
              onClick={checkConfig}
              disabled={configLoading}
            >
              <RefreshCw className={`size-3.5 ${configLoading ? 'animate-spin' : ''}`} />
              Re-check Configuration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-3 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-emerald-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-3 sm:px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
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
        <span className="text-3xl sm:text-4xl font-bold text-foreground">${price}</span>
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
        <CardContent className="space-y-2 sm:space-y-3">
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
      <div className="text-center space-y-2 sm:space-y-3">
        <Button
          className="w-full max-w-sm h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold gap-2"
          onClick={handleUpgrade}
          disabled={upgrading || (!configLoading && stripeConfig !== null && !stripeConfig.configured)}
        >
          {upgrading ? (
            <span className="animate-pulse">Redirecting to checkout...</span>
          ) : (!configLoading && stripeConfig !== null && !stripeConfig.configured) ? (
            <>
              <AlertTriangle className="size-4" />
              Payment Not Ready
            </>
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

      {/* Activation Code Section - for owner/developer access */}
      <div className="pt-2">
        {!showActivation ? (
          <button
            onClick={() => setShowActivation(true)}
            className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Key className="size-3" />
            Have an activation code?
          </button>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="size-4 text-muted-foreground" />
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
                <Button size="sm" onClick={handleActivation} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Activate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
