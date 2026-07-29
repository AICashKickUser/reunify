'use client'

const APP_LOCK_ENABLED_KEY = 'reunify-app-lock-enabled'
const APP_LOCK_PIN_HASH_KEY = 'reunify-app-lock-pin-hash'
const APP_LOCK_SALT = 'reunify-salt-2024'

/**
 * Hash a PIN using SHA-256 with a salt.
 * Not crypto-grade, but sufficient for a 4-digit PIN stored locally.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + APP_LOCK_SALT)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Check if app lock is enabled.
 */
export function isAppLockEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(APP_LOCK_ENABLED_KEY) === 'true'
}

/**
 * Check if a PIN has been set up.
 */
export function isPinSet(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(APP_LOCK_PIN_HASH_KEY)
}

/**
 * Store the PIN hash (not the actual PIN).
 */
export async function setAppLockPin(pin: string): void {
  const hash = await hashPin(pin)
  localStorage.setItem(APP_LOCK_PIN_HASH_KEY, hash)
  localStorage.setItem(APP_LOCK_ENABLED_KEY, 'true')
}

/**
 * Verify a PIN against the stored hash.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(APP_LOCK_PIN_HASH_KEY)
  if (!storedHash) return false
  const inputHash = await hashPin(pin)
  return inputHash === storedHash
}

/**
 * Enable app lock. Requires PIN to already be set.
 */
export function enableAppLock(): void {
  localStorage.setItem(APP_LOCK_ENABLED_KEY, 'true')
}

/**
 * Disable app lock.
 */
export function disableAppLock(): void {
  localStorage.setItem(APP_LOCK_ENABLED_KEY, 'false')
}

/**
 * Clear all app lock data (full reset).
 */
export function clearAppLock(): void {
  localStorage.removeItem(APP_LOCK_ENABLED_KEY)
  localStorage.removeItem(APP_LOCK_PIN_HASH_KEY)
}

/**
 * Check if WebAuthn (biometric) is available on this device/browser.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!window.PublicKeyCredential) return false
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch {
    return false
  }
}

/**
 * Attempt biometric authentication using WebAuthn.
 * Returns true if the user successfully authenticates.
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  try {
    if (!window.PublicKeyCredential) return false

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    if (!available) return false

    // Create a challenge for authentication
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Reunify',
          id: window.location.hostname,
        },
        user: {
          id: new Uint8Array(16), // dummy user id
          name: 'reunify-user',
          displayName: 'Reunify User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 30000,
      },
    })

    return !!credential
  } catch {
    return false
  }
}
