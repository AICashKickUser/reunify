/**
 * Cloud Backup Library for Reunify
 * Handles encrypted backup upload, download, restore, and auto-backup logic.
 * Uses simple XOR encryption with a key derived from the case ID.
 */

const BACKUP_VERSION = '1.0.0'
const AUTO_BACKUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const LOCALSTORAGE_KEY_PREFIX = 'reunify-last-backup-'

// ── XOR Encryption ──────────────────────────────────────────────────────

/**
 * Derive a simple encryption key from a case ID.
 * Not crypto-grade, but prevents casual snooping.
 */
function deriveKey(caseId: string): string {
  // Simple hash: rotate characters and repeat to make a longer key
  let key = ''
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < caseId.length; j++) {
      const charCode = caseId.charCodeAt(j)
      key += String.fromCharCode(((charCode * (i + 1) + j * 7) % 94) + 33)
    }
  }
  return key
}

/**
 * XOR encrypt/decrypt a string using a key.
 * XOR is symmetric: encrypt === decrypt.
 */
function xorCipher(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

/**
 * Encrypt backup data as base64-encoded XOR cipher.
 */
export function encryptBackupData(jsonString: string, caseId: string): string {
  const key = deriveKey(caseId)
  const encrypted = xorCipher(jsonString, key)
  // Convert to base64 for safe storage
  return btoa(encrypted)
}

/**
 * Decrypt backup data from base64-encoded XOR cipher.
 */
export function decryptBackupData(encryptedBase64: string, caseId: string): string {
  const key = deriveKey(caseId)
  const encrypted = atob(encryptedBase64)
  return xorCipher(encrypted, key)
}

// ── LocalStorage Helpers ────────────────────────────────────────────────

function getLastBackupTime(caseId: string): number | null {
  try {
    const stored = localStorage.getItem(`${LOCALSTORAGE_KEY_PREFIX}${caseId}`)
    if (stored) return parseInt(stored, 10)
  } catch { /* ignore */ }
  return null
}

function setLastBackupTime(caseId: string, timestamp: number): void {
  try {
    localStorage.setItem(`${LOCALSTORAGE_KEY_PREFIX}${caseId}`, timestamp.toString())
  } catch { /* ignore */ }
}

// ── Backup Status ───────────────────────────────────────────────────────

export interface BackupStatus {
  lastBackupTime: number | null
  lastBackupAgo: string | null  // e.g. "2 min ago", "3 hours ago"
  isStale: boolean              // >1 hour since last backup
  hasNeverSynced: boolean
  dataSize: number | null       // size in bytes
}

export function getBackupStatus(caseId: string): BackupStatus {
  const lastBackupTime = getLastBackupTime(caseId)

  if (!lastBackupTime) {
    return {
      lastBackupTime: null,
      lastBackupAgo: null,
      isStale: true,
      hasNeverSynced: true,
      dataSize: null,
    }
  }

  const now = Date.now()
  const diffMs = now - lastBackupTime
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  let lastBackupAgo: string
  if (diffMin < 1) {
    lastBackupAgo = 'just now'
  } else if (diffMin < 60) {
    lastBackupAgo = `${diffMin} min ago`
  } else if (diffHours < 24) {
    lastBackupAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else {
    const diffDays = Math.floor(diffHours / 24)
    lastBackupAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  return {
    lastBackupTime,
    lastBackupAgo,
    isStale: diffMs > 3600000, // >1 hour
    hasNeverSynced: false,
    dataSize: null,
  }
}

// ── Fetch Backup Status from Server ─────────────────────────────────────

export async function getServerBackupStatus(caseId: string): Promise<BackupStatus & { serverLastBackup: string | null; serverBackupCount: number }> {
  const localStatus = getBackupStatus(caseId)

  try {
    const res = await fetch(`/api/backup/status?caseId=${caseId}`)
    if (!res.ok) throw new Error('Failed to fetch backup status')
    const data = await res.json()

    // If server has a newer backup, update local timestamp
    if (data.lastBackupAt) {
      const serverTime = new Date(data.lastBackupAt).getTime()
      const localTime = localStatus.lastBackupTime || 0
      if (serverTime > localTime) {
        setLastBackupTime(caseId, serverTime)
        // Recalculate with updated time
        return getBackupStatus(caseId) as BackupStatus & { serverLastBackup: string | null; serverBackupCount: number }
      }
    }

    return {
      ...localStatus,
      serverLastBackup: data.lastBackupAt || null,
      serverBackupCount: data.backupCount || 0,
      dataSize: data.dataSize || null,
    }
  } catch {
    return {
      ...localStatus,
      serverLastBackup: null,
      serverBackupCount: 0,
    }
  }
}

// ── Perform Backup ──────────────────────────────────────────────────────

export async function performBackup(caseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Gather all case data from the server
    const res = await fetch(`/api/export?caseId=${caseId}`)
    if (!res.ok) throw new Error('Failed to gather case data')
    const caseData = await res.json()

    // 2. Encrypt the data
    const jsonString = JSON.stringify(caseData)
    const encryptedData = encryptBackupData(jsonString, caseId)

    // 3. Upload to server
    const uploadRes = await fetch('/api/backup/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId,
        data: encryptedData,
        version: BACKUP_VERSION,
      }),
    })

    if (!uploadRes.ok) {
      const errData = await uploadRes.json().catch(() => ({}))
      throw new Error(errData.error || 'Upload failed')
    }

    // 4. Update local timestamp
    setLastBackupTime(caseId, Date.now())

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ── Restore from Cloud ──────────────────────────────────────────────────

export async function restoreFromCloud(caseId: string): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    // 1. Download from server
    const res = await fetch(`/api/backup/download?caseId=${caseId}`)
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Download failed')
    }

    const { data: encryptedData, version } = await res.json()

    // 2. Decrypt the data
    const jsonString = decryptBackupData(encryptedData, caseId)
    const caseData = JSON.parse(jsonString)

    // 3. Return the data for the caller to handle restoration
    return { success: true, data: caseData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ── Auto Backup ─────────────────────────────────────────────────────────

/**
 * Called after data changes. Only backs up if >5 min since last backup.
 * Also checks if the user is online.
 */
export async function autoBackup(caseId: string): Promise<{ backedUp: boolean; error?: string }> {
  // Check if online
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { backedUp: false, error: 'Offline' }
  }

  // Check if enough time has passed since last backup
  const lastBackupTime = getLastBackupTime(caseId)
  if (lastBackupTime && (Date.now() - lastBackupTime) < AUTO_BACKUP_INTERVAL_MS) {
    return { backedUp: false } // Not enough time has passed
  }

  const result = await performBackup(caseId)
  if (result.success) {
    return { backedUp: true }
  }
  return { backedUp: false, error: result.error }
}

/**
 * Force a backup regardless of the interval.
 */
export async function forceBackup(caseId: string): Promise<{ success: boolean; error?: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false, error: 'You are offline. Please connect to the internet to sync.' }
  }
  return performBackup(caseId)
}
