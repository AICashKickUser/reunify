import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SubscriptionTier = 'free' | 'pro'

interface SubscriptionState {
  tier: SubscriptionTier
  upgradeDialogOpen: boolean
  setTier: (tier: SubscriptionTier) => void
  setUpgradeDialogOpen: (open: boolean) => void
  isPro: () => boolean
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
      setTier: (tier) => set({ tier }),
      setUpgradeDialogOpen: (open) => set({ upgradeDialogOpen: open }),
      isPro: () => get().tier === 'pro',
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
