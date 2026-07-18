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
  { key: 'pdf_export', label: 'PDF Export', description: 'Export court-ready compliance reports as PDF' },
  { key: 'detailed_summary', label: 'Detailed Summary', description: 'Full compliance summary with achievements & needs-work areas' },
  { key: 'multiple_cases', label: 'Multiple Cases', description: 'Track more than one case at a time' },
  { key: 'reminders', label: 'Smart Reminders', description: 'Get alerts for upcoming court dates and deadlines' },
  { key: 'data_backup', label: 'Cloud Backup', description: 'Automatic encrypted backup of your case data' },
  { key: 'photo_attachments', label: 'Photo Attachments', description: 'Attach photos of certificates, receipts, and documents' },
  { key: 'achievement_badges', label: 'Achievement Badges', description: 'Earn badges for hitting milestones and staying compliant' },
  { key: 'sharing', label: 'Attorney Sharing', description: 'Share progress reports directly with your attorney or caseworker' },
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
