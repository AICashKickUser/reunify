'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Pro Feature Definitions ────────────────────────────────────────────────

export const PRO_FEATURES = [
  {
    id: 'court-reports',
    title: 'Court-Ready PDF Reports',
    description: 'Professional progress reports formatted for judges & social workers',
    icon: '📄',
  },
  {
    id: 'auto-backup',
    title: 'Auto Cloud Backup',
    description: 'Automatic backups so you never lose your progress data',
    icon: '☁️',
  },
  {
    id: 'email-reports',
    title: 'Email Progress Reports',
    description: 'Send progress updates directly to your attorney or social worker',
    icon: '📧',
  },
  {
    id: 'enhanced-charts',
    title: 'Enhanced Progress Charts',
    description: 'Advanced visualizations that show your compliance clearly',
    icon: '📊',
  },
  {
    id: 'verified-badge',
    title: 'Verified by Reunify Pro',
    description: 'Badge on reports showing verified, court-ready documentation',
    icon: '✅',
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
      window.dispatchEvent(new CustomEvent('show-upgrade-dialog', { detail: { featureId } }))
    },
  }
}
