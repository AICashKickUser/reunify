'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Pro Feature Definitions ────────────────────────────────────────────────
// The free app is fully functional for ALL tracking — no limits on entries.
// Pro makes the OUTPUT dramatically better: court-ready reports, cloud backup,
// email reports, verified badge. The value is in what you SHOW the court.

export const FREE_FEATURES = [
  {
    id: 'case-tracking',
    title: 'Unlimited Case Tracking',
    description: 'Track every requirement, drug test, visit, class, and milestone — no limits',
    icon: '📋',
  },
  {
    id: 'basic-pdf',
    title: 'Basic PDF Reports',
    description: 'Generate simple progress reports with your compliance data',
    icon: '📄',
  },
  {
    id: 'scan-case-plan',
    title: 'Scan Case Plan',
    description: 'Photograph your case plan to auto-populate requirements',
    icon: '📸',
  },
  {
    id: 'progress-charts',
    title: 'Progress Charts',
    description: 'Visual charts showing your compliance over time',
    icon: '📊',
  },
  {
    id: 'data-export',
    title: 'Data Export & Local Backup',
    description: 'Export all your data and automatic local backups',
    icon: '💾',
  },
] as const

export const PRO_FEATURES = [
  {
    id: 'court-ready-pdf',
    title: 'Court-Ready PDF Report',
    description: 'Professional report with compliance narrative, strength score, verified badge, and recommendations — designed for judges',
    icon: '⚖️',
  },
  {
    id: 'auto-cloud-backup',
    title: 'Auto Cloud Backup',
    description: 'Encrypted cloud backups so you never lose your case data',
    icon: '☁️',
  },
  {
    id: 'email-reports',
    title: 'Email Reports to Attorney',
    description: 'Send court-ready progress reports directly to your attorney or social worker',
    icon: '📧',
  },
  {
    id: 'verified-badge',
    title: 'Verified by Reunify Pro',
    description: 'Verified badge on reports proving court-ready, documented compliance',
    icon: '✅',
  },
  {
    id: 'priority-support',
    title: 'Priority Support',
    description: 'Get help faster when court dates are approaching',
    icon: '🎯',
  },
] as const

export type ProFeatureId = typeof PRO_FEATURES[number]['id']

// ─── Subscription State ──────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro'
export type SubscriptionStatus = 'inactive' | 'active' | 'trialing' | 'past_due' | 'canceled'

interface SubscriptionState {
  tier: SubscriptionTier
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  trialEnd: string | null
  // Actions
  setSubscription: (data: Partial<SubscriptionState>) => void
  activatePro: (data?: { periodEnd?: string; trialEnd?: string; customerId?: string; subscriptionId?: string }) => void
  deactivatePro: () => void
  clearSubscription: () => void
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      tier: 'free',
      status: 'inactive',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      trialEnd: null,

      setSubscription: (data) => set(data),

      activatePro: (data) => set({
        tier: 'pro',
        status: data?.trialEnd ? 'trialing' : 'active',
        currentPeriodEnd: data?.periodEnd ?? null,
        trialEnd: data?.trialEnd ?? null,
        stripeCustomerId: data?.customerId ?? null,
        stripeSubscriptionId: data?.subscriptionId ?? null,
      }),

      deactivatePro: () => set({
        tier: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: null,
        trialEnd: null,
      }),

      clearSubscription: () => set({
        tier: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialEnd: null,
      }),
    }),
    {
      name: 'reunify-subscription',
    }
  )
)

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Check if the user has an active pro subscription */
export function isProActive(state: SubscriptionState): boolean {
  if (state.tier !== 'pro') return false
  if (state.status === 'active' || state.status === 'trialing') return true
  // Check if current period hasn't ended
  if (state.currentPeriodEnd && new Date(state.currentPeriodEnd) > new Date()) return true
  return false
}

/** Check if the user is in a trial */
export function isTrialing(state: SubscriptionState): boolean {
  return state.status === 'trialing' && state.tier === 'pro'
}

/** Hook-friendly check: is this pro feature available? */
export function useProFeature(featureId: ProFeatureId): {
  isPro: boolean
  isTrialing: boolean
  showUpgrade: () => void
} {
  const store = useSubscriptionStore()
  const pro = isProActive(store)

  return {
    isPro: pro,
    isTrialing: isTrialing(store),
    showUpgrade: () => {
      // Dispatch event to show upgrade dialog
      window.dispatchEvent(new CustomEvent('reunify-show-upgrade', { detail: { feature: featureId } }))
    },
  }
}
