# Reunify v1.8.0 - Android App Bundle

## Package Information
- **Package ID**: com.aicashkick.reunify
- **Version Code**: 8
- **Version Name**: 1.8.0
- **Target SDK**: 35
- **Min SDK**: 24
- **Host**: reunify-six.vercel.app
- **Start URL**: /

## Build Details
- **Build Type**: TWA (Trusted Web Activity)
- **Build Tool**: @bubblewrap/core v1.24.1
- **Signed**: Yes (reunify-key.jks, alias: reunify)
- **Build Date**: 2025-08-01

## What's New in v1.8.0
- ✅ **Native app experience** — No more browser chrome! Runs fullscreen like a real app
- ✅ **Digital Asset Links** (assetlinks.json) — Android verifies your app and removes browser UI
- ✅ **Maskable icons** — Proper adaptive icon support on all Android devices
- ✅ **App shortcuts** — Long-press the app icon for quick access to "My Case" and "Quick Log"
- ✅ **Improved service worker** — Better offline support with stale-while-revalidate caching
- ✅ **iOS support** — Apple touch icon, splash screen, and status bar styling
- ✅ **Manifest v1.8.0** — Proper icon purposes, screenshots, and shortcuts

## Critical: Digital Asset Links
This version includes `/.well-known/assetlinks.json` which tells Android:
"This TWA is authorized to run fullscreen without browser chrome."

**Verify it works after deploying:**
```
curl https://reunify-six.vercel.app/.well-known/assetlinks.json
```
You should see the JSON with your signing key fingerprint.

## Upload Instructions
1. Go to Google Play Console: https://play.google.com/console
2. Select the Reunify app
3. Navigate to **Production → Create new release**
4. Upload the `reunify-1.8.0.aab` file
5. Enter release notes (see below)
6. Review and submit

## Release Notes (copy this for Play Console)
```
🎉 App now runs as a real native app!

• Full-screen experience — no more browser URL bar or navigation
• Quick-access shortcuts — long-press the app icon for My Case and Quick Log
• Better offline support — works more reliably without internet
• Improved icons — looks sharper on all Android devices
• Performance improvements and bug fixes
```

## Files
- `reunify-1.8.0.aab` - The signed Android App Bundle (1.3 MB)
- `README-1.8.0.md` - This file
