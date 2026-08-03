# Reunify v1.10.0 - Android App Bundle

## Package Information
- **Package ID**: com.aicashkick.reunify
- **Version Code**: 9
- **Version Name**: 1.10.0
- **Target SDK**: 36 (Android 16)
- **Min SDK**: 24
- **Host**: reunify-six.vercel.app
- **Start URL**: /

## Build Details
- **Build Type**: TWA (Trusted Web Activity)
- **Build Tool**: @bubblewrap/core v1.24.1
- **Signed**: Yes (reunify-key.jks, alias: reunify)
- **Build Date**: 2025-08-03

## What's New in v1.10.0
- ✅ **Target SDK 36** (Android 16) — Complies with Google Play's API level requirement
- ✅ **Edge-to-edge support** — Added `displayOverride: fullscreen-sticky` for Android 15+ compatibility
- ✅ **Large screen support** — Removed `portrait-primary` orientation restriction; now uses `orientation: default` to support foldables and tablets
- ✅ **Predictive back gesture** — Added `android:enableOnBackInvokedCallback="true"` for Android 14+ back gesture
- ✅ **Resizeable activity** — Added `android:resizeableActivity="true"` for multi-window/large screen support
- ✅ **PWA manifest updated** — Changed `orientation` from `portrait-primary` to `any`

## Google Play Compliance Fixes
This update addresses the following Google Play Console warnings:
1. **Target API level**: Updated from 35 to 36 (Android 16)
2. **Edge-to-edge deprecated APIs**: Added `displayOverride: fullscreen-sticky` and handled insets
3. **Large screen orientation restrictions**: Removed `portrait-primary` orientation lock; Android 16 will no longer enforce orientation restrictions on large screens
4. **Resizability restrictions**: Added `android:resizeableActivity="true"` to support multi-window mode

## Critical: Digital Asset Links
Verify the Digital Asset Links file is served at:
```
https://reunify-six.vercel.app/.well-known/assetlinks.json
```

## Upload Instructions
1. Go to Google Play Console
2. Select the Reunify app
3. Navigate to **Production → Create new release**
4. Upload the `reunify-1.10.0.aab` file
5. Add release notes: "Updated to target Android 16 (API level 36). Added support for large screen devices like foldables and tablets. Improved edge-to-edge display compatibility."
6. Review and roll out
