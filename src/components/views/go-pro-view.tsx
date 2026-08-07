'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { isProActive, useSubscriptionStore, PRO_FEATURES, FREE_FEATURES } from '@/lib/subscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Crown, Check, Sparkles, Loader2, Shield, FileText, Cloud, Mail, BarChart3, Target, ClipboardList, Camera, BarChart2, Save, Ticket } from 'lucide-react'
import { toast } from 'sonner'

const FEATURE_ICONS: Record<string, React.ElementType> = {
  'auto-cloud-backup': Cloud,
  'email-reports': Mail,
  'enhanced-charts': BarChart3,
  'verified-badge': Shield,
  'priority-support': Target,
  'case-tracking': ClipboardList,
  'pdf-reports': FileText,
  'scan-case-plan': Camera,
  'progress-charts': BarChart2,
  'data-export': Save,
}

export function GoProView() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [configChecked, setConfigChecked] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [showPromo, setShowPromo] = useState(false)
  const subscription = useSubscriptionStore()
  const isPro = isProActive(subscription)

  useEffect(() => {
    fetch('/api/stripe/config')
      .then(r => r.json())
      .then(data => setConfigured(data.configured === true))
      .catch(() => setConfigured(false))
      .finally(() => setConfigChecked(true))
  }, [])

  const handleUpgrade = async () => {
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
        window.location.href = data.url
      }
    } catch {
      toast.error('Could not start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code.')
      return
    }

    setPromoLoading(true)
    try {
      const response = await fetch('/api/stripe/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim() }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      if (data.success) {
        subscription.activatePro({
          periodEnd: data.currentPeriodEnd,
          customerId: 'promo',
          subscriptionId: `promo-${Date.now()}`,
        })
        toast.success(data.message || 'Pro activated!')
        setPromoCode('')
        setShowPromo(false)
      }
    } catch {
      toast.error('Could not validate promo code. Please try again.')
    } finally {
      setPromoLoading(false)
    }
  }

  const handleManage = async () => {
    if (!subscription.stripeCustomerId || subscription.stripeCustomerId === 'promo') {
      toast.info('Pro was activated via promo code. No billing portal needed.')
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
    } catch {
      toast.error('Could not open billing portal.')
    } finally {
      setLoading(false)
    }
  }

  const monthlyPrice = 4.99
  const annualPrice = 39.99
  const annualMonthly = (annualPrice / 12).toFixed(2)

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
          <Crown className="size-5 sm:size-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Reunify Pro</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Look your best for judges and social workers
          </p>
        </div>
      </div>

      {/* Pro Status Banner */}
      {isPro && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="size-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                {subscription.stripeCustomerId === 'promo'
                  ? 'Pro via Promo Code'
                  : subscription.status === 'trialing'
                    ? 'Free Trial Active'
                    : 'Pro Subscription Active'}
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground">
                  {subscription.stripeCustomerId === 'promo'
                    ? `Active until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : subscription.cancelAtPeriodEnd
                      ? `Ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                      : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              )}
            </div>
            {subscription.stripeCustomerId && subscription.stripeCustomerId !== 'promo' && (
              <Button variant="outline" size="sm" onClick={handleManage} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Manage'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Free Tier - Always Fully Functional */}
      <Card className="border-emerald-200 dark:border-emerald-800">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-emerald-600" />
            <CardTitle className="text-sm sm:text-base font-semibold text-emerald-800 dark:text-emerald-300">
              Free Forever — Fully Functional
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 px-4 sm:px-6">
          <p className="text-xs text-muted-foreground mb-3">
            All core features work for free, always. No limits, no paywalls on essential tools.
          </p>
          {FREE_FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id] || Check
            return (
              <div key={feature.id} className="flex items-start gap-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/10">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Icon className="size-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pro Features */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-amber-600" />
            <CardTitle className="text-sm sm:text-base font-semibold">Pro — Premium Extras</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 px-4 sm:px-6">
          <p className="text-xs text-muted-foreground mb-3">
            Pro adds premium features on top of the free app. The free app is always fully usable.
          </p>
          {PRO_FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id] || Check
            return (
              <div key={feature.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/10">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Icon className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Pricing + Promo Code */}
      {!isPro && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Stripe Payment Option */}
            {configured && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBilling('monthly')}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                      billing === 'monthly'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-muted hover:border-amber-200'
                    }`}
                  >
                    <p className="text-base font-bold">${monthlyPrice}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling('annual')}
                    className={`flex-1 p-3 rounded-lg border-2 text-center transition-all relative ${
                      billing === 'annual'
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                        : 'border-muted hover:border-amber-200'
                    }`}
                  >
                    <Badge className="absolute -top-2 -right-1 bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">
                      Save 33%
                    </Badge>
                    <p className="text-base font-bold">${annualMonthly}</p>
                    <p className="text-xs text-muted-foreground">per month (${annualPrice}/yr)</p>
                  </button>
                </div>

                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white h-12 text-base font-semibold shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
                    <Loader2 className="size-5 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="size-5 mr-2" />
                  )}
                  Start 7-Day Free Trial
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  7-day free trial, then {billing === 'monthly' ? `$${monthlyPrice}/month` : `$${annualPrice}/year`}. Cancel anytime.
                </p>
              </>
            )}

            {/* Stripe not configured message */}
            {!configured && configChecked && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Payment setup in progress — use a promo code below to unlock Pro now.</p>
              </div>
            )}

            {/* Promo Code Section - always available */}
            <div className="pt-1 border-t border-border/50">
              {!showPromo ? (
                <button
                  type="button"
                  onClick={() => setShowPromo(true)}
                  className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Ticket className="size-3.5" />
                  Have a promo code?
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter promo code"
                      className="flex-1 h-9 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handlePromoCode()}
                    />
                    <Button
                      onClick={handlePromoCode}
                      disabled={promoLoading || !promoCode.trim()}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {promoLoading ? <Loader2 className="size-3 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Promo codes unlock Pro features without payment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Why Pro */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <strong className="text-foreground">Why Pro?</strong> When you walk into court with a professional progress report 
            showing your compliance, clean drug tests, and completed classes — judges and social workers take notice. 
            Pro adds cloud backup, email reports, and a verified badge to make your case even stronger. 
            But the free app is always fully functional — no limits, no paywalls on essentials.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default GoProView
