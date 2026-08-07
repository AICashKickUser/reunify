'use client'

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react'
import { Lock, Fingerprint, ShieldCheck, Delete } from 'lucide-react'
import {
  isAppLockEnabled,
  isPinSet,
  setAppLockPin,
  verifyPin,
  isBiometricAvailable,
  authenticateWithBiometric,
  clearAppLock,
} from '@/lib/app-lock'

type LockMode = 'setup' | 'confirm' | 'unlock'

interface AppLockScreenProps {
  onUnlock: () => void
}

const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 30

// --- Client-side detection via useSyncExternalStore ---
const emptySubscribe = () => () => {}
const returnTrue = () => true
const returnFalse = () => false

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, returnTrue, returnFalse)
}

export function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const isClient = useIsClient()
  // Use lazy initialization for mode — avoids setState in effect
  const [mode, setMode] = useState<LockMode>(() => {
    if (!isClient) return 'unlock'
    return isPinSet() ? 'unlock' : 'setup'
  })
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Check biometric availability (async — setState in callback, not synchronous in effect body)
  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable)
  }, [])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => {
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current)
      }
    }
  }, [cooldown > 0])

  const triggerShake = useCallback(() => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }, [])

  const handlePinComplete = useCallback(async (enteredPin: string) => {
    if (isProcessing) return
    setIsProcessing(true)

    if (mode === 'setup') {
      setConfirmPin(enteredPin)
      setPin('')
      setMode('confirm')
      setIsProcessing(false)
    } else if (mode === 'confirm') {
      if (enteredPin === confirmPin) {
        await setAppLockPin(enteredPin)
        setPin('')
        setMode('unlock')
        onUnlock()
      } else {
        setError('PINs do not match. Try again.')
        triggerShake()
        setPin('')
        setConfirmPin('')
        setMode('setup')
      }
      setIsProcessing(false)
    } else if (mode === 'unlock') {
      const isValid = await verifyPin(enteredPin)
      if (isValid) {
        setPin('')
        setAttempts(0)
        onUnlock()
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setPin('')

        if (newAttempts >= MAX_ATTEMPTS) {
          setCooldown(COOLDOWN_SECONDS)
          setError(`Too many attempts. Try again in ${COOLDOWN_SECONDS} seconds.`)
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }
        triggerShake()
      }
      setIsProcessing(false)
    }
  }, [mode, confirmPin, attempts, onUnlock, triggerShake, isProcessing])

  const handleDigitPress = useCallback((digit: string) => {
    if (cooldown > 0) return
    if (pin.length >= 4) return

    setError('')
    const newPin = pin + digit
    setPin(newPin)

    if (newPin.length === 4) {
      setTimeout(() => handlePinComplete(newPin), 150)
    }
  }, [pin, cooldown, handlePinComplete])

  const handleDelete = useCallback(() => {
    if (pin.length === 0) return
    setPin(pin.slice(0, -1))
    setError('')
  }, [pin])

  const handleBiometric = useCallback(async () => {
    if (cooldown > 0) return
    const success = await authenticateWithBiometric()
    if (success) {
      setAttempts(0)
      onUnlock()
    }
  }, [onUnlock, cooldown])

  const handleForgotPin = useCallback(() => {
    clearAppLock()
    setPin('')
    setConfirmPin('')
    setAttempts(0)
    setCooldown(0)
    setError('')
    setMode('setup')
  }, [])

  const getModeTitle = () => {
    switch (mode) {
      case 'setup': return 'Set Your PIN'
      case 'confirm': return 'Re-Enter Your PIN'
      case 'unlock': return 'Enter Your PIN'
    }
  }

  const getModeSubtitle = () => {
    switch (mode) {
      case 'setup': return 'Choose a 4-digit PIN to protect your data'
      case 'confirm': return 'Enter the same 4 digits to confirm'
      case 'unlock': return 'Enter your PIN to unlock'
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-emerald-950 via-emerald-900 to-gray-950 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-400 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-emerald-300 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        {/* Lock Icon */}
        <div className="flex size-20 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-6">
          {mode === 'setup' || mode === 'confirm' ? (
            <ShieldCheck className="size-10 text-emerald-400" />
          ) : (
            <Lock className="size-10 text-emerald-400" />
          )}
        </div>

        {/* Branding */}
        <h1 className="text-2xl font-bold text-white mb-1">Reunify</h1>
        <p className="text-emerald-300/80 text-sm mb-2">{getModeTitle()}</p>
        <p className="text-emerald-400/50 text-xs mb-8">{getModeSubtitle()}</p>

        {/* Confirm mode transition banner */}
        {mode === 'confirm' && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center max-w-xs">
            <p className="text-amber-200 text-sm font-semibold">PIN entered!</p>
            <p className="text-amber-300/80 text-xs mt-1">Now re-enter the same 4 digits to confirm</p>
          </div>
        )}

        {/* PIN Dots */}
        <div
          className={`flex items-center gap-5 mb-8 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          style={{
            animation: shake ? 'shake 0.5s ease-in-out' : undefined,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`size-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50'
                  : 'bg-white/20 border-2 border-white/30'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs text-center max-w-xs">
            {error}
          </div>
        )}

        {/* Cooldown Display */}
        {cooldown > 0 && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm text-center">
            Try again in {cooldown}s
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[300px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') {
              return <div key="empty" className="min-h-[72px]" />
            }
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="flex items-center justify-center min-h-[72px] rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 active:scale-95 transition-all text-white/60 hover:text-white"
                  aria-label="Delete"
                >
                  <Delete className="size-7" />
                </button>
              )
            }
            return (
              <button
                key={key}
                onClick={() => handleDigitPress(key)}
                disabled={cooldown > 0}
                className="flex items-center justify-center min-h-[72px] rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 active:scale-95 transition-all text-white text-3xl font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Digit ${key}`}
              >
                {key}
              </button>
            )
          })}
        </div>

        {/* Biometric Button */}
        {biometricAvailable && mode === 'unlock' && (
          <button
            onClick={handleBiometric}
            disabled={cooldown > 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all text-emerald-300 text-sm font-medium mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Fingerprint className="size-5" />
            Use Biometric
          </button>
        )}

        {/* Forgot PIN */}
        {mode === 'unlock' && (
          <button
            onClick={handleForgotPin}
            className="text-emerald-400/50 hover:text-emerald-400/80 text-xs transition-colors underline underline-offset-2"
          >
            Forgot PIN?
          </button>
        )}

        {/* Setup hint */}
        {mode === 'setup' && (
          <p className="text-emerald-400/40 text-xs text-center mt-2">
            This PIN protects your sensitive CPS case data
          </p>
        )}
      </div>

      {/* Shake animation keyframes */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

/**
 * Hook to manage app lock state.
 * - Auto-relocks when app goes to background (visibilitychange)
 * - Auto-relocks after inactivity timeout (5 minutes)
 * - Reactive to localStorage changes from sidebar toggle
 * - Uses useSyncExternalStore for SSR-safe client detection
 */
const AUTO_LOCK_MINUTES = 5

export function useAppLock() {
  const isClient = useIsClient()
  // Version counter forces re-render when lock state changes externally
  const [version, setVersion] = useState(0)
  const [unlockState, setUnlockState] = useState(false)
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read lock state reactively (version bump triggers re-read)
  const lockEnabled = isClient && isAppLockEnabled()

  // If lock is not enabled, the app is considered unlocked
  const isUnlocked = !lockEnabled || unlockState

  const handleUnlock = useCallback(() => {
    setUnlockState(true)
  }, [])

  const lockApp = useCallback(() => {
    if (isAppLockEnabled()) {
      setUnlockState(false)
    }
  }, [])

  // Refresh lock state — always forces re-render
  const refreshLockState = useCallback(() => {
    setVersion((v) => v + 1)
    if (!isAppLockEnabled()) {
      setUnlockState(true)
    } else {
      // Lock was just enabled — lock the app immediately
      setUnlockState(false)
    }
  }, [])

  // Listen for localStorage changes from other components (e.g., sidebar toggle)
  // Uses both the native 'storage' event (cross-tab) and a custom event (same-tab)
  useEffect(() => {
    if (!isClient) return

    const handleLockChange = () => {
      setVersion((v) => v + 1)
      if (!isAppLockEnabled()) {
        setUnlockState(true)
      } else {
        // Lock was just enabled — lock the app immediately
        setUnlockState(false)
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'reunify-app-lock-enabled' || e.key === 'reunify-app-lock-pin-hash') {
        handleLockChange()
      }
    }

    // Custom event for same-tab communication (storage event only fires cross-tab)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('reunify-lock-change', handleLockChange)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('reunify-lock-change', handleLockChange)
    }
  }, [isClient])

  // Auto-lock when app goes to background (visibilitychange)
  useEffect(() => {
    if (!isClient || !lockEnabled || !unlockState) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isAppLockEnabled()) {
        // App went to background — lock it
        setUnlockState(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isClient, lockEnabled, unlockState])

  // Inactivity timer — auto-lock after 5 minutes of no interaction
  useEffect(() => {
    if (!isClient || !lockEnabled || !unlockState) return

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      inactivityTimerRef.current = setTimeout(() => {
        if (isAppLockEnabled()) {
          setUnlockState(false)
        }
      }, AUTO_LOCK_MINUTES * 60 * 1000)
    }

    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const
    events.forEach((event) => document.addEventListener(event, resetTimer, { passive: true }))

    // Start initial timer
    resetTimer()

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      events.forEach((event) => document.removeEventListener(event, resetTimer))
    }
  }, [isClient, lockEnabled, unlockState])

  return {
    isUnlocked,
    lockEnabled,
    handleUnlock,
    refreshLockState,
    lockApp,
    mounted: isClient,
  }
}
