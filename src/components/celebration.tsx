'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'

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
  shape: 'circle' | 'square' | 'triangle'
  xDrift: number
}

const CONFETTI_COLORS = [
  '#10b981', // emerald-500
  '#34d399', // emerald-400
  '#f59e0b', // amber-500
  '#fbbf24', // amber-400
  '#8b5cf6', // violet-500
  '#a78bfa', // violet-400
  '#ec4899', // pink-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
  '#eab308', // yellow-500
]

function generateConfettiPieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10 - Math.random() * 20,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 1.5,
    shape: (['circle', 'square', 'triangle'] as const)[Math.floor(Math.random() * 3)],
    xDrift: (Math.random() - 0.5) * 60,
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
              backgroundColor: piece.shape !== 'triangle' ? piece.color : 'transparent',
              borderRadius: piece.shape === 'circle' ? '50%' : piece.shape === 'square' ? '2px' : '0',
              borderLeft: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
              borderRight: piece.shape === 'triangle' ? `${piece.size / 2}px solid transparent` : undefined,
              borderBottom: piece.shape === 'triangle' ? `${piece.size}px solid ${piece.color}` : undefined,
              transform: `rotate(${piece.rotation}deg)`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// --- Celebration Message ---
function CelebrationMessage({ message, emoji }: { message: string; emoji: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9998] pointer-events-none">
      <div className="animate-celebration-pop bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-emerald-300 dark:border-emerald-700 px-6 py-5 sm:px-8 sm:py-6 text-center max-w-xs sm:max-w-sm mx-4">
        <div className="text-4xl sm:text-5xl mb-2">{emoji}</div>
        <p className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      </div>
    </div>
  )
}

// --- Main Celebration Component ---
interface CelebrationProps {
  /** Whether to trigger the celebration */
  active: boolean
  /** The congratulatory message to display */
  message: string
  /** Emoji to show (default: 🎉) */
  emoji?: string
  /** Duration in ms before auto-dismiss (default: 3000) */
  duration?: number
  /** Number of confetti pieces (default: 50) */
  confettiCount?: number
  /** Callback when celebration is dismissed */
  onDismiss?: () => void
}

export function Celebration({
  active,
  message,
  emoji = '🎉',
  duration = 3000,
  confettiCount = 50,
  onDismiss,
}: CelebrationProps) {
  // Generate pieces whenever active becomes true — keyed by a trigger counter
  const [triggerKey, setTriggerKey] = useState(0)
  const prevActiveRef = useRef(false)

  // Detect rising edge of `active` (false → true) to regenerate confetti
  if (active && !prevActiveRef.current) {
    setTriggerKey((k) => k + 1)
  }
  prevActiveRef.current = active

  const pieces = useMemo(() => {
    if (triggerKey > 0) {
      return generateConfettiPieces(confettiCount)
    }
    return []
  }, [triggerKey, confettiCount])

  // Auto-dismiss timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (active) {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        onDismiss?.()
      }, duration)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [active, duration, onDismiss])

  if (!active) return null

  return (
    <>
      <ConfettiOverlay pieces={pieces} />
      <CelebrationMessage message={message} emoji={emoji} />
    </>
  )
}

// --- Hook: useCelebration ---
interface UseCelebrationReturn {
  celebrate: (message: string, emoji?: string) => void
  CelebrationOverlay: () => React.JSX.Element | null
}

export function useCelebration(): UseCelebrationReturn {
  const [state, setState] = useState<{
    active: boolean
    message: string
    emoji: string
  }>({ active: false, message: '', emoji: '🎉' })

  const celebrate = useCallback((message: string, emoji: string = '🎉') => {
    setState({ active: true, message, emoji })
  }, [])

  const handleDismiss = useCallback(() => {
    setState((prev) => ({ ...prev, active: false }))
  }, [])

  const CelebrationOverlay = useCallback(() => {
    if (!state.active) return null
    return (
      <Celebration
        active={state.active}
        message={state.message}
        emoji={state.emoji}
        onDismiss={handleDismiss}
      />
    )
  }, [state, handleDismiss])

  return { celebrate, CelebrationOverlay }
}
