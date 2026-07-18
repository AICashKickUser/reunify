'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface ProBadgeProps {
  size?: 'sm' | 'md'
  className?: string
}

export function ProBadge({ size = 'sm', className = '' }: ProBadgeProps) {
  if (size === 'md') {
    return (
      <Badge
        className={`bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 gap-1 px-2.5 py-0.5 text-xs font-bold shadow-sm ${className}`}
      >
        <Sparkles className="size-3" />
        PRO
      </Badge>
    )
  }

  return (
    <Badge
      className={`bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 gap-0.5 px-1.5 py-0 text-[10px] font-bold leading-4 shadow-sm ${className}`}
    >
      <Sparkles className="size-2.5" />
      PRO
    </Badge>
  )
}
