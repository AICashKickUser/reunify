import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SubscriptionTier = 'free' | 'pro'
export type BillingPeriod = 'monthly' | 'yearly'

interface SubscriptionState {
  tier: SubscriptionTier
  upgradeDialogOpen: boolean
  stripeSessionId: string | null
  stripeCustomerId: string | null
  subscriptionStatus: string | null
  trialEnd: number | null
  currentPeriodEnd: number | null
  cancelAtPeriodEnd: boolean
  setTier: (tier: SubscriptionTier) => void
  setUpgradeDialogOpen: (open: boolean) => void
  setStripeSession: (sessionId: string | null) => void
  setSubscriptionData: (data: {
    tier: SubscriptionTier
    stripeSessionId?: string | null
    stripeCustomerId?: string | null
    subscriptionStatus?: string | null
    trialEnd?: number | null
    currentPeriodEnd?: number | null
    cancelAtPeriodEnd?: boolean
  }) => void
  isPro: () => boolean
  isTrial: () => boolean
  logout: () => void
}

// PRO_FEATURES list for reference
export const PRO_FEATURES = [
  { key: 'pdf_export', label: 'PDF Court Report', description: 'Professional court-ready compliance report for your judge, attorney, or caseworker' },
  { key: 'detailed_summary', label: 'Pro Summary Report', description: 'Detailed compliance summary with achievements, needs-work areas, and professional formatting' },
  { key: 'visual_charts', label: 'Progress Charts', description: 'Radar and comparison charts showing your progress at a glance' },
  { key: 'data_export', label: 'Data Backup & Export', description: 'Export your complete case data as JSON for backup or sharing' },
  { key: 'smart_reminders', label: 'Smart Reminders', description: 'Get alerts for upcoming court dates, drug tests, and deadlines' },
  { key: 'photo_attachments', label: 'Photo Attachments', description: 'Attach photos of certificates, receipts, and documents to your records' },
  { key: 'attorney_sharing', label: 'Attorney Sharing', description: 'Share your progress report directly with your attorney or caseworker' },
  { key: 'priority_support', label: 'Priority Support', description: 'Get help faster when you need it most' },
]

export const PRO_PRICE_MONTHLY = 4.99
export const PRO_PRICE_YEARLY = 39.99

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free' as SubscriptionTier,
      upgradeDialogOpen: false,
      stripeSessionId: null,
      stripeCustomerId: null,
      subscriptionStatus: null,
      trialEnd: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      setTier: (tier) => set({ tier }),
      setUpgradeDialogOpen: (open) => set({ upgradeDialogOpen: open }),
      setStripeSession: (sessionId) => set({ stripeSessionId: sessionId }),
      setSubscriptionData: (data) => set(data),
      isPro: () => get().tier === 'pro',
      isTrial: () => {
        const state = get()
        return state.tier === 'pro' && state.trialEnd !== null && state.trialEnd > Date.now() / 1000
      },
      logout: () => set({
        tier: 'free',
        stripeSessionId: null,
        stripeCustomerId: null,
        subscriptionStatus: null,
        trialEnd: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }),
    }),
    { name: 'reunify-subscription' }
  )
)

// Hook to check feature access
export function useProFeature(featureKey: string): { allowed: boolean; showUpgrade: () => void } {
  const { tier, setUpgradeDialogOpen } = useSubscriptionStore()
  return {
    allowed: tier === 'pro',
    showUpgrade: () => setUpgradeDialogOpen(true),
  }
}
