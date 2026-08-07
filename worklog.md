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

---
Task ID: 2
Agent: Main
Task: Update assetlinks.json and build script with Google Play upload key fingerprints

Work Log:
- Verified upload key fingerprints match existing keystore (reunify-key.jks)
- SHA-1: 6C:EA:F6:28:8E:53:A4:02:E5:A6:8F:09:80:AC:DA:A9:26:2B:54:10 ✅
- SHA-256: 4F:87:6C:A7:EF:9A:86:D5:72:E8:B7:5B:52:30:0C:17:59:D9:22:1C:E0:0D:AD:79:8F:02:70:09:6B:21:9E:90 ✅
- Updated assetlinks.json to include upload key SHA-256 fingerprint alongside existing app signing key
- Updated build-twa.js fingerprints array with upload key SHA-256
- Verified AAB (reunify-1.11.0.aab) is signed with correct upload key

Stage Summary:
- assetlinks.json now has both upload key and app signing key fingerprints
- Build script updated with upload key fingerprint
- AAB is ready for upload to Google Play Console

---
Task ID: 3
Agent: Main
Task: Fix version number mismatch - user sees "1.7" but should see "1.11.0"

Work Log:
- Found 5 different version numbers scattered across codebase (1.7.0, 1.9.0, 1.10.0, 1.11.0)
- Updated package.json: 1.7.0 → 1.11.0
- Updated manifest.json: 1.10.0 → 1.11.0
- Updated sw.js CACHE_NAME: reunify-v1.10.0 → reunify-v1.11.0
- Updated app-sidebar.tsx: v1.9.0 → v1.11.0
- page.tsx footer was already v1.11.0 (confirmed)
- Updated download API route default and allowedFiles
- Updated download-aab API route to serve 1.11.0 AAB
- Verified all 7 locations now show 1.11.0

Stage Summary:
- All version numbers synchronized to 1.11.0
- New SW cache name (reunify-v1.11.0) will force cache invalidation on next load
- User seeing "1.7" was from stale Vercel deployment / cached service worker
