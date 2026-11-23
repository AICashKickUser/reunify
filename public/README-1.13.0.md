# Reunify v1.13.0 - Android App Bundle

## Package Information
- **Package ID**: com.aicashkick.reunify
- **Version Code**: 12
- **Version Name**: 1.13.0
- **Target SDK**: 36 (Android 16)
- **Min SDK**: 24
- **Host**: reunify-six.vercel.app
- **Start URL**: /

## What's New in v1.13.0

### New Features
1. **Communication Log** — Track every call, text, email, and in-person contact with your social worker, attorney, judge, CASA, and others. Includes action items with follow-up dates.
2. **Document Vault** — Securely store court orders, certificates, drug test results, and more. Photo upload with automatic compression, PDF support, full-screen viewer.

### Maintenance
- Updated Next.js 16.1.3 → 16.4.6 (security + bug fixes)
- Updated React 19.2.3 → 19.3.1
- Updated all Radix UI, Stripe SDK, and Prisma to latest patches
- Fixed declaration-order bug in scan-case-plan
- Migrated use-mobile hook to useSyncExternalStore
- Cleaned up 7 lint errors from updated React hooks plugin

## How to Build the AAB

### Prerequisites
- JDK 21+ installed and `JAVA_HOME` set
- Android SDK installed with `platforms;android-36` and `build-tools;36.0.0`
- `ANDROID_HOME` environment variable set

### Build Steps
1. Push all code changes to GitHub → Vercel auto-deploys to reunify-six.vercel.app
2. Verify the production site is live: visit https://reunify-six.vercel.app
3. Run the build script:
   ```bash
   export JAVA_HOME=/path/to/jdk-21
   export ANDROID_HOME=/path/to/android-sdk
   node scripts/build-twa.js
   ```
4. The signed AAB will be generated at: `public/play-store/reunify-1.13.0.aab`

## Upload to Google Play Console

1. Go to https://play.google.com/console
2. Select the Reunify app
3. Navigate to **Production → Create new release**
4. Upload the `reunify-1.13.0.aab` file
5. Add release notes:
   ```
   New in v1.13.0:
   - Communication Log: Track every call, text, and conversation with your social worker, attorney, and others. Includes follow-up reminders.
   - Document Vault: Securely store court orders, certificates, and drug test results right on your phone. Photo upload with automatic compression.
   - Performance improvements and dependency updates for better stability.
   ```
6. Review and roll out to production

## Critical: Digital Asset Links
Verify the Digital Asset Links file is served at:
```
https://reunify-six.vercel.app/.well-known/assetlinks.json
```
This must return HTTP 200 with the correct package name and fingerprints.

## Signing
- **Keystore**: `public/play-store/reunify-key.jks` (alias: reunify)
- The AAB is signed automatically during the Gradle build process
- **Do not lose the keystore** — without it, you can never update the app on the Play Store
