'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Check, Loader2, Sparkles } from 'lucide-react'
import { PRO_FEATURES } from '@/lib/subscription'
import { useSubscriptionStore, isProActive } from '@/lib/subscription'
import { toast } from 'sonner'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function UpgradeDialog({ open, onOpenChange, feature }: UpgradeDialogProps) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState(false)
  const subscription = useSubscriptionStore()
  const isPro = isProActive(subscription)

  // Check if Stripe is configured
  useEffect(() => {
    fetch('/api/stripe/config')
      .then(r => r.json())
      .then(data => setConfigured(data.configured === true))
      .catch(() => setConfigured(false))
  }, [])

  // Listen for upgrade dialog events
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      console.log('[upgrade-dialog] Show upgrade for:', customEvent.detail?.featureId)
    }
    window.addEventListener('show-upgrade-dialog', handler)
    return () => window.removeEventListener('show-upgrade-dialog', handler)
  }, [])

  const handleUpgrade = async () => {
    if (!configured) {
      toast.error('Payment system is being set up. Please try again later.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: billing }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (err) {
      toast.error('Could not start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManage = async () => {
    if (!subscription.stripeCustomerId) {
      toast.error('No billing account found')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      toast.error('Could not open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const monthlyPrice = 4.99
  const annualPrice = 39.99
  const annualMonthly = (annualPrice / 12).toFixed(2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Crown className="size-4 text-amber-600" />
            </div>
            <DialogTitle className="text-lg">
              {isPro ? 'Reunify Pro' : 'Upgrade to Pro'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isPro
              ? 'You have access to all Pro features. Manage your subscription below.'
              : 'Your free app is fully functional. Pro adds premium extras to make your case even stronger.'}
          </DialogDescription>
        </DialogHeader>

        {/* Free app reassurance */}
        {!isPro && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              All case tracking, drug test logs, progress, PDF reports, and scan features work for free — forever. No limits.
            </p>
          </div>
        )}

        {/* Pro Feature List */}
        <div className="space-y-2.5 my-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pro adds:</p>
          {PRO_FEATURES.map((feature) => (
            <div key={feature.id} className="flex items-start gap-2.5">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mt-0.5">
                <Check className="size-3 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        {!isPro && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`flex-1 p-2.5 rounded-lg border-2 text-center transition-all ${
                  billing === 'monthly'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-muted hover:border-amber-200'
                }`}
              >
                <p className="text-sm font-semibold">${monthlyPrice}/mo</p>
                <p className="text-xs text-muted-foreground">Monthly</p>
              </button>
              <button
                type="button"
                onClick={() => setBilling('annual')}
                className={`flex-1 p-2.5 rounded-lg border-2 text-center transition-all relative ${
                  billing === 'annual'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                    : 'border-muted hover:border-amber-200'
                }`}
              >
                <Badge className="absolute -top-2 -right-1 bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">
                  Save 33%
                </Badge>
                <p className="text-sm font-semibold">${annualMonthly}/mo</p>
                <p className="text-xs text-muted-foreground">${annualPrice}/year</p>
              </button>
            </div>

            <Button
              onClick={handleUpgrade}
              disabled={loading || !configured}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="size-4 mr-2" />
              )}
              {configured ? 'Start 7-Day Free Trial' : 'Coming Soon'}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Free trial then {billing === 'monthly' ? `$${monthlyPrice}/month` : `$${annualPrice}/year`}. Cancel anytime.
              Your basic app features always work for free.
            </p>
          </div>
        )}

        {/* Manage Subscription (Pro users) */}
        {isPro && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <Crown className="size-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {subscription.status === 'trialing' ? 'Free Trial Active' : 'Pro Active'}
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-xs text-muted-foreground">
                    {subscription.cancelAtPeriodEnd
                      ? `Ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            </div>

            {subscription.stripeCustomerId && (
              <Button
                onClick={handleManage}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Manage Subscription
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
