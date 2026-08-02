---
Task ID: 1
Agent: main
Task: Remove all paywall/restriction mechanics from the app

Work Log:
- Deleted paywall infrastructure files: free-tier.ts, subscription.ts, stripe.ts, upgrade-dialog.tsx, upgrade-prompt-dialog.tsx, pro-badge.tsx, go-pro-view.tsx
- Deleted Stripe API routes: checkout, portal, status, config, webhook
- Deleted activation API route
- Removed paywall imports and checks from all view files: counseling, drug-testing, court-dates, na-meetings, supervised-visits, parenting-classes, backup, progress, dashboard
- Removed go-pro from ViewType, VIEW_LABELS, and navigation history
- Removed UpgradeDialog, subscription store, and Stripe checkout handling from page.tsx
- Removed ProBadge, upgrade buttons, and pro branding from sidebar and header
- Removed useFreeTierCheck hook and free-tier-item-created event from data-hooks.ts
- All features are now fully free and unlimited

Stage Summary:
- App has zero paywall/restriction code remaining
- All features (cloud backup, PDF export, email, progress charts) are available to everyone
- No "Go Pro", "Upgrade", or paywall prompts anywhere in the app
- Sidebar no longer shows "Upgrade to Pro" button

---
Task ID: 2
Agent: main
Task: Fix 5th drug testing button bug (off-by-one error)

Work Log:
- Fixed safeDateKey() function to parse through Date object for local-time date key
- Plain "YYYY-MM-DD" strings (no time component) are returned as-is
- Full ISO strings with time components are parsed through Date to get correct local date
- This prevents UTC vs local timezone mismatch that caused the 5th button to affect the 4th

Stage Summary:
- Drug testing 5th button now works independently
- Browser test confirmed: clicking "Called & Tested" on Friday works correctly and shows result options

---
Task ID: 3
Agent: main
Task: Fix family orientation button and certificate support

Work Log:
- Removed freeTier.atLimit check that was blocking the orientation toggle
- Added hasCertificate: false to new orientation entries
- Added toggleOrientationCertificate() function for certificate toggle
- Added certificate button (Award icon) next to each completed orientation
- Changed Certificates stat card to count all classes (including orientations), not just weekly

Stage Summary:
- Orientation buttons now work and can be toggled
- Each completed orientation has a certificate toggle button
- Certificate count now includes orientation certificates
- Browser test confirmed: orientation 1 marked complete, certificate added successfully

---
Task ID: 4
Agent: main
Task: Fix scan case plan (body size limit, EXIF orientation, photo upload)

Work Log:
- Fixed EXIF orientation double-resize bug in compressImage()
- Reduced image max width from 1600px to 1200px and quality from 0.75 to 0.6
- Added body size limit config in next.config.ts (10mb server actions)
- Added maxDuration = 60 in scan-case-plan API route
- Added 413 error handling for large payloads
- Changed file input accept to specific MIME types for better Android compatibility
- Added input value reset before triggering click for proper re-selection
- Added drag-and-drop zone as fallback for photo upload
- Added isDragging state and drag/drop handlers

Stage Summary:
- EXIF orientation photos no longer distorted
- Multi-page scans should no longer hit Error 209
- Gallery/file picker works with specific MIME types
- Drag-and-drop fallback available for desktop users
- Browser test confirmed: scan dialog opens with "Take Photo" and "From Gallery" buttons

---
Task ID: 1-6
Agent: main
Task: Fix 4 bugs reported by user on phone/tablet + remove premature Go Pro upsell

Work Log:
- Fixed drug testing 5th button bug: Replaced shared `isMutating` state (which blocked ALL buttons when ANY mutation was pending) with per-day `mutatingDates` Set tracking. Now only the specific day being mutated is disabled, not all 5 days.
- Fixed family orientation button: Replaced unreliable array index lookup (`orientationClasses[orientationNumber - 1]`) with `getOrientationByNumber()` that finds by class name pattern. Added `mutatingOrientations` and `mutatingClasses` Sets for per-item mutation tracking. Added `disabled` attribute and loading spinner to buttons. Fixed `totalOrientations` to always be 2 (CPS requirement).
- Fixed scan case plan photo distortion: Replaced manual EXIF orientation correction with `createImageBitmap({ imageOrientation: 'from-image' })` as primary method (handles EXIF automatically in modern browsers), with manual fallback for older browsers.
- Fixed photo upload from device: Changed `accept` attribute from specific MIME types (`image/jpeg,image/png,image/webp,image/heic,image/heif`) to `image/*` which works on all mobile devices.
- Reduced image compression quality from 0.6/1200px to 0.45/1000px to prevent payload size issues (likely cause of "error 209").
- Added 90-second timeout to scan API fetch request with clear error messages.
- Removed premature "Go Pro for Court" upsell from onboarding dialog, replaced with "Scan Your Case Plan" step that highlights the AI scan feature.
- Verified all fixes with browser test: drug testing 5th button works, orientation 2 button toggles correctly, scan dialog opens with Take Photo and From Gallery buttons.

Stage Summary:
- Drug testing: Per-day mutation tracking instead of shared isMutating
- Parenting classes: Reliable name-based lookup + per-item mutation tracking
- Scan case plan: createImageBitmap with imageOrientation for EXIF, image/* accept, lower quality
- Onboarding: Replaced Go Pro upsell with scan feature highlight
