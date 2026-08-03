---
Task ID: 1
Agent: Main
Task: Fix all bugs and update TWA for Google Play API 36 compliance

Work Log:
- Updated TWA build script (scripts/build-twa.js) for full API 36 compliance:
  - Removed deprecated `displayOverride: ['fullscreen-sticky']` (was causing Google Play's deprecated API warning)
  - Added `android:screenOrientation` removal from AndroidManifest.xml (large screen compliance)
  - Added `android:resizeableActivity="false"` → `"true"` fix
  - Added Step 4b: Patch TwaLauncherActivity to call `enableEdgeToEdge()` for proper edge-to-edge handling
  - Added Step 4c: Patch build.gradle for AndroidX activity dependency
  - Incremented version to 1.11.0 (code 10)
  - Added `findFiles()` helper function

- Fixed drug testing 5th button bug (off-by-one/stale closure):
  - Added `activeCaseIdRef` ref to avoid stale closure in `handleStatusChange`
  - Changed `handleStatusChange` to use `activeCaseIdRef.current` instead of `activeCaseId`
  - Changed `handleResultChange` to use `activeCaseIdRef.current` instead of `activeCaseId`
  - Changed `useCallback` deps to `[]` since all state is now read from refs
  - Used `currentCaseId` variable instead of `activeCaseId` in create mutation

- Fixed family orientation button (can't mark completed):
  - Added `activeCaseIdRef`, `createMutateRef`, `updateMutateRef` refs for stable access in callbacks
  - Changed `toggleOrientation` to use refs instead of closure variables
  - Changed `toggleOrientationCertificate` to use refs instead of closure variables
  - This prevents stale closures from blocking the mutation

- Fixed scan case plan (photo distortion + upload failure):
  - Fixed `compressImage` function: when `createImageBitmap` with `imageOrientation` fails,
    now falls through to manual EXIF correction instead of using `createImageBitmap` without
    `imageOrientation` (which was causing distorted images on mobile)
  - Changed file inputs from `className="hidden"` to `className="sr-only"` for better mobile compatibility
  - Increased raw data URL fallback limit from 2MB to 5MB (checks data URL length instead of file size)
  - Increased server body size limit from 10MB to 15MB
  - Increased client-side payload check from 8MB to 12MB

- Verified paywall is already correctly set up:
  - Free tier has all core features (case tracking, drug testing, scan, orientation, etc.)
  - Pro features are additive (court reports, auto backup, email reports, enhanced charts, verified badge)
  - No changes needed to paywall

Stage Summary:
- All 6 tasks completed
- TWA build script ready for API 36 compliance (needs rebuild with Android SDK to generate new AAB)
- Drug testing 5th button bug fixed with ref-based approach
- Family orientation button fixed with ref-based approach
- Scan case plan photo distortion fixed by properly falling through to EXIF correction
- Photo upload improved with sr-only class and larger fallback limits
- App running successfully on localhost:3000 with no errors
