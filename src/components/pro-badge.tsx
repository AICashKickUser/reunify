'use client'

import { isProActive, useSubscriptionStore } from '@/lib/subscription'
import { Crown } from 'lucide-react'

interface ProBadgeProps {
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function ProBadge({ size = 'md', showIcon = true, className }: ProBadgeProps) {
  const subscription = useSubscriptionStore()
  const isPro = isProActive(subscription)

  if (!isPro) return null

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white leading-none shadow-sm ${className || ''} ${
      size === 'sm' ? 'px-1.5 py-0.5 text-[9px] font-bold' : 'px-2 py-1 text-[10px] font-bold'
    }`}>
      {showIcon && <Crown className={size === 'sm' ? 'size-2.5' : 'size-3'} />}
      PRO
    </span>
  )
}
