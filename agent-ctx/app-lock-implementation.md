# App Lock Feature Implementation

## Task: PIN/Biometric App Lock for Reunify CPS

### Files Created

1. **`/src/lib/app-lock.ts`** — Lock logic utilities
   - `hashPin(pin)` — SHA-256 hash with salt for PIN storage
   - `isAppLockEnabled()` — checks localStorage for lock state
   - `isPinSet()` — checks if a PIN hash exists
   - `setAppLockPin(pin)` — stores PIN hash + enables lock
   - `verifyPin(pin)` — verifies PIN against stored hash
   - `enableAppLock()` / `disableAppLock()` — toggle lock
   - `clearAppLock()` — full reset (removes hash + enabled flag)
   - `isBiometricAvailable()` — WebAuthn platform authenticator check
   - `authenticateWithBiometric()` — WebAuthn credential creation for biometric unlock

2. **`/src/components/app-lock.tsx`** — Lock screen component + hook
   - `AppLockScreen` — Full-screen overlay with dark emerald gradient
   - PIN entry with 4 dots, 0-9 keypad, delete button
   - Modes: setup, confirm, unlock
   - Biometric unlock button (if WebAuthn available)
   - Shake animation on wrong PIN
   - 5-attempt limit with 30-second cooldown
   - "Forgot PIN?" resets to setup mode
   - `useAppLock()` hook — manages lock state using `useSyncExternalStore` for SSR safety

3. **`/src/app/page.tsx`** — Updated to integrate lock screen
   - Added `useAppLock()` hook
   - Conditional render: if `mounted && !isUnlocked`, show `AppLockScreen`

4. **`/src/components/app-sidebar.tsx`** — Updated with lock toggle
   - "App Lock" toggle in sidebar footer with Lock/Unlock icon
   - Setup dialog with PIN entry + confirmation
   - Disable dialog requiring PIN verification
   - Uses `useSyncExternalStore` for SSR-safe state reading

### Lint Status
- All errors resolved (was 5 errors, now 0)
- Used `useSyncExternalStore` to avoid setState-in-effect lint errors
- Used lazy initialization for mode state to avoid effect-based initialization
