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
      case 'confirm': return 'Confirm Your PIN'
      case 'unlock': return 'Enter Your PIN'
    }
  }

  const getModeSubtitle = () => {
    switch (mode) {
      case 'setup': return 'Choose a 4-digit PIN to protect your data'
      case 'confirm': return 'Re-enter your PIN to confirm'
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
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
            if (key === '') {
              return <div key="empty" className="h-16" />
            }
            if (key === 'del') {
              return (
                <button
                  key="del"
                  onClick={handleDelete}
                  className="flex items-center justify-center h-16 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-white/20 active:scale-95 transition-all text-white/60 hover:text-white"
                  aria-label="Delete"
                >
                  <Delete className="size-6" />
                </button>
              )
            }
            return (
              <button
                key={key}
                onClick={() => handleDigitPress(key)}
                disabled={cooldown > 0}
                className="flex items-center justify-center h-16 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/25 active:scale-95 transition-all text-white text-2xl font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
 * Uses useSyncExternalStore for SSR-safe client detection
 * and derived state to avoid setState-in-effect issues.
 */
export function useAppLock() {
  const isClient = useIsClient()
  const lockEnabled = isClient && isAppLockEnabled()
  const [unlockState, setUnlockState] = useState(false)

  // If lock is not enabled, the app is considered unlocked
  const isUnlocked = !lockEnabled || unlockState

  const handleUnlock = useCallback(() => {
    setUnlockState(true)
  }, [])

  const refreshLockState = useCallback(() => {
    // Force re-render by toggling unlock state if lock is disabled
    if (!isAppLockEnabled()) {
      setUnlockState(true)
    }
  }, [])

  const lockApp = useCallback(() => {
    if (isAppLockEnabled()) {
      setUnlockState(false)
    }
  }, [])

  return {
    isUnlocked,
    lockEnabled,
    handleUnlock,
    refreshLockState,
    lockApp,
    mounted: isClient,
  }
}
