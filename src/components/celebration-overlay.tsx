'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import {
  shouldShowCelebration,
  markCelebrationShown,
  getCelebrationLabel,
  getCelebrationEmoji,
  getMotivationalQuote,
  type CelebrationType,
} from '@/lib/streaks'

// --- CSS Confetti Piece ---
interface ConfettiPiece {
  id: number
  x: number
  y: number
  color: string
  size: number
  rotation: number
  delay: number
  duration: number
  shape: 'circle' | 'square' | 'triangle' | 'star'
  xDrift: number
}

const CONFETTI_COLORS = [
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#eab308', // yellow-500
  '#ef4444', // red-500
]

function generateConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 2,
    shape: (['circle', 'square', 'triangle', 'star'] as const)[Math.floor(Math.random() * 4)],
    xDrift: (Math.random() - 0.5) * 80,
  }))
}

// --- Confetti Overlay ---
function ConfettiOverlay({ pieces }: { pieces: ConfettiPiece[] }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            ['--x-drift' as string]: `${piece.xDrift}px`,
          }}
        >
          <div
            className="animate-confetti-spin"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.shape !== 'triangle' && piece.shape !== 'star' ? piece.color : 'transparent',
              borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '0',
              borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
              borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
              borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : undefined,
              clipPath: piece.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : undefined,
              backgroundColor: piece.shape === 'star' ? piece.color : undefined,
              transform: `rotate(${piece.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// --- Celebration Message ---
function CelebrationMessage({
  type,
  quote,
  onDismiss,
}: {
  type: CelebrationType
  quote: string
  onDismiss: () => void
}) {
  const label = getCelebrationLabel(type)
  const emoji = getCelebrationEmoji(type)

  // Extract the number of days from the type
  const days = parseInt(type.split('-')[0])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9998] p-4"
      onClick={onDismiss}
      role="dialog"
      aria-label={label}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Content */}
      <div className="animate-celebration-pop relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-emerald-300 dark:border-emerald-700 max-w-sm w-full overflow-hidden">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 py-5 text-center">
          <div className="text-4xl sm:text-5xl mb-2">{emoji}</div>
          <div className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">
            {days}
          </div>
          <p className="text-emerald-100 text-sm sm:text-base font-medium mt-1">
            Day Streak!
          </p>
        </div>

        {/* Message */}
        <div className="px-6 py-5 text-center">
          <p className="text-lg sm:text-xl font-bold text-foreground mb-2">
            {label}
          </p>
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
          <button
            className="mt-4 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            onClick={onDismiss}
          >
            Keep Going! 🎉
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Celebration Overlay Component ---
export function CelebrationOverlay() {
  const hasCheckedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check for pending celebration on mount using lazy initialization
  const [initialCelebration] = useState<CelebrationType | null>(() => {
    if (typeof window === 'undefined') return null
    const pending = shouldShowCelebration()
    if (pending) {
      markCelebrationShown(pending)
      return pending
    }
    return null
  })

  const [celebration, setCelebration] = useState<CelebrationType | null>(initialCelebration)
  const [quote, setQuote] = useState(() => initialCelebration ? getMotivationalQuote() : '')
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>(() =>
    initialCelebration ? generateConfettiPieces(60) : []
  )

  // Mark as checked on mount
  useEffect(() => {
    hasCheckedRef.current = true
  }, [])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (celebration) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCelebration(null)
      }, 5000)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [celebration])

  const handleDismiss = useCallback(() => {
    setCelebration(null)
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  // Listen for custom celebration events from recordActivity
  useEffect(() => {
    const handleCelebration = (e: CustomEvent) => {
      const type = e.detail as CelebrationType
      if (type) {
        markCelebrationShown(type)
        setQuote(getMotivationalQuote())
        setConfettiPieces(generateConfettiPieces(60))
        setCelebration(type)
      }
    }
    window.addEventListener('celebration-trigger' as string, handleCelebration as EventListener)
    return () => {
      window.removeEventListener('celebration-trigger' as string, handleCelebration as EventListener)
    }
  }, [])

  if (!celebration) return null

  return (
    <>
      <ConfettiOverlay pieces={confettiPieces} />
      <CelebrationMessage
        type={celebration}
        quote={quote}
        onDismiss={handleDismiss}
      />
    </>
  )
}
