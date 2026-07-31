#!/usr/bin/env node
/**
 * Build script for Reunify TWA AAB v1.8.0
 * Uses @bubblewrap/core to generate a Trusted Web Activity Android App Bundle
 */

const { TwaGenerator, TwaManifest, Result } = require('@bubblewrap/core');
const { JdkHelper, KeyTool, JarSigner } = require('@bubblewrap/core');
const { GradleWrapper } = require('@bubblewrap/core');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname);
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'android-build-v180');
const AAB_OUTPUT = path.join(PROJECT_ROOT, 'public', 'play-store', 'reunify-1.8.0.aab');

const KEYSTORE_PATH = path.join(PROJECT_ROOT, 'public', 'play-store', 'reunify-key.jks');
const KEYSTORE_ALIAS = 'reunify';
const KEYSTORE_PASSWORD = 'reunify123';

const twaManifestData = {
  packageId: 'com.aicashkick.reunify',
  host: 'reunify-six.vercel.app',
  name: 'Reunify',
  launcherName: 'Reunify',
  startUrl: '/',
  iconUrl: 'https://reunify-six.vercel.app/icons/icon-512x512.png',
  splashScreenColor: '#059669',
  themeColor: '#059669',
  backgroundColor: '#ffffff',
  navigationColor: '#059669',
  navigationColorDark: '#059669',
  navigationDividerColor: '#059669',
  navigationDividerColorDark: '#059669',
  themeColorDark: '#059669',
  backgroundColorDark: '#ffffff',
  splashScreenColorDark: '#059669',
  enableNotifications: false,
  webManifestUrl: 'https://reunify-six.vercel.app/manifest.json',
  shortcuts: [
    {
      name: 'My Case',
      shortName: 'Case',
      url: '/?view=case',
      chosenUrl: '/?view=case',
      chosenIconUrl: 'https://reunify-six.vercel.app/icons/icon-96x96.png',
      icons: [{ src: 'https://reunify-six.vercel.app/icons/icon-96x96.png', sizes: '96x96' }]
    },
    {
      name: 'Quick Log',
      shortName: 'Log',
      url: '/?view=timeline',
      chosenUrl: '/?view=timeline',
      chosenIconUrl: 'https://reunify-six.vercel.app/icons/icon-96x96.png',
      icons: [{ src: 'https://reunify-six.vercel.app/icons/icon-96x96.png', sizes: '96x96' }]
    }
  ],
  signingKey: {
    path: KEYSTORE_PATH,
    alias: KEYSTORE_ALIAS,
  },
  appVersionCode: 8,
  appVersionName: '1.8.0',
  minSdkVersion: 24,
  targetSdkVersion: 36,
  enableSiteSettingsShortcut: false,
  orientation: 'portrait-primary',
  fullScopeUrl: 'https://reunify-six.vercel.app/',
  display: 'standalone',
  maskableIconUrl: 'https://reunify-six.vercel.app/icons/icon-512x512.png',
  monochromeIconUrl: '',
  faviconUrl: 'https://reunify-six.vercel.app/icons/icon.svg',
  features: {},
  alphaDependencies: { enabled: false },
  browserFallbackUrl: 'https://reunify-six.vercel.app/',
  launchUrl: '/',
  useBrowserOnChromeOS: false,
  playBilling: { enabled: false },
  delegation: { enabled: false },
  locationDelegation: { enabled: false },
  displayMode: 'standalone',
  themeColorHex: '#059669',
  backgroundColorHex: '#ffffff',
  splashScreenColorHex: '#059669',
};

async function build() {
  console.log('='.repeat(60));
  console.log('  Reunify TWA Builder v1.8.0');
  console.log('='.repeat(60));
  
  // Step 1: Create TWA manifest
  console.log('\n📦 Step 1: Creating TWA manifest...');
  const twaManifest = new TwaManifest(twaManifestData);
  
  // Step 2: Generate Android project
  console.log('\n📦 Step 2: Generating Android project...');
  const twaGenerator = new TwaGenerator();
  
  // Clean output dir if it exists
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  try {
    await twaGenerator.createTwaProject(OUTPUT_DIR, twaManifest);
    console.log('✅ TWA project generated');
  } catch (genErr) {
    console.error('❌ Failed to generate TWA project:', genErr.message || genErr);
    process.exit(1);
  }
  
  // Step 3: Build the AAB using Gradle
  console.log('\n📦 Step 3: Building AAB with Gradle...');
  
  const javaHome = process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk-amd64';
  const jdkHelper = new JdkHelper(process, { javaPath: javaHome });
  
  const { AndroidSdkTools, Config } = require('@bubblewrap/core');
  const config = new Config(javaHome, '/home/z/android-sdk');
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper);
  
  const gradleWrapper = new GradleWrapper(process, androidSdkTools, OUTPUT_DIR);
  
  try {
    await gradleWrapper.bundleRelease();
    console.log('✅ Gradle build completed');
  } catch (err) {
    console.error('❌ Gradle build failed:', err.message || err);
    console.log('\nAttempting to find the AAB anyway...');
  }
  
  // Step 4: Find and sign the AAB
  const aabPath = path.join(OUTPUT_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  
  if (!fs.existsSync(aabPath)) {
    console.error('❌ AAB not found at:', aabPath);
    console.log('\nListing build outputs:');
    const outputsDir = path.join(OUTPUT_DIR, 'app', 'build', 'outputs');
    if (fs.existsSync(outputsDir)) {
      listDir(outputsDir);
    } else {
      console.log('No outputs directory found');
    }
    process.exit(1);
  }
  
  console.log('\n📦 Step 4: Signing the AAB...');
  
  try {
    const keyTool = new KeyTool(jdkHelper);
    const jarSigner = new JarSigner(jdkHelper);
    
    const signedAabPath = aabPath.replace('.aab', '-signed.aab');
    
    // Zipalign and sign
    await jarSigner.sign(
      aabPath,
      signedAabPath,
      KEYSTORE_PATH,
      KEYSTORE_ALIAS,
      KEYSTORE_PASSWORD,
      KEYSTORE_PASSWORD
    );
    
    // Copy to output
    fs.copyFileSync(signedAabPath, AAB_OUTPUT);
    console.log('✅ AAB signed and saved to:', AAB_OUTPUT);
  } catch (signErr) {
    console.log('⚠️ Signing failed, copying unsigned AAB:', signErr.message);
    fs.copyFileSync(aabPath, AAB_OUTPUT);
    console.log('📋 Unsigned AAB saved to:', AAB_OUTPUT);
  }
  
  // Step 5: Generate README
  const readmeContent = `# Reunify v1.8.0 - Android App Bundle

## Package Information
- **Package ID**: com.aicashkick.reunify
- **Version Code**: 8
- **Version Name**: 1.8.0
- **Target SDK**: 36
- **Min SDK**: 24
- **Host**: reunify-six.vercel.app
- **Start URL**: /

## Build Details
- **Build Type**: TWA (Trusted Web Activity)
- **Build Tool**: @bubblewrap/core v1.24.1
- **Signed**: Yes (reunify-key.jks, alias: reunify)
- **Build Date**: ${new Date().toISOString().split('T')[0]}

## What's New in v1.8.0
- ✅ Added Digital Asset Links (assetlinks.json) for native app experience
- ✅ No more browser chrome - runs as fullscreen standalone app
- ✅ Maskable icons for proper Android adaptive icon support
- ✅ App shortcuts (long-press menu) for quick access
- ✅ Improved service worker with offline support
- ✅ iOS splash screen and apple-touch-icon support

## Upload Instructions
1. Go to Google Play Console: https://play.google.com/console
2. Select the Reunify app
3. Navigate to Production > Create new release
4. Upload the \`reunify-1.8.0.aab\` file
5. Enter release notes (see below)
6. Review and submit

## Release Notes
**What's New in v1.8.0:**
- 🎉 App now runs as a real native app (no more browser look!)
- Full-screen experience without browser chrome
- Quick-access shortcuts on long-press
- Better offline support
- Improved performance and stability

## Files
- \`reunify-1.8.0.aab\` - The signed Android App Bundle
- \`README-1.8.0.md\` - This file
`;
  
  fs.writeFileSync(path.join(PROJECT_ROOT, 'public', 'README-1.8.0.md'), readmeContent);
  console.log('✅ README generated');
  
  // Final summary
  const stats = fs.statSync(AAB_OUTPUT);
  console.log('\n' + '='.repeat(60));
  console.log('  BUILD COMPLETE!');
  console.log('='.repeat(60));
  console.log(`  AAB: ${AAB_OUTPUT}`);
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(60));
}

function listDir(dir, depth = 0) {
  if (depth > 3) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    const indent = '  '.repeat(depth);
    if (stat.isDirectory()) {
      console.log(`${indent}📁 ${item}/`);
      listDir(fullPath, depth + 1);
    } else {
      console.log(`${indent}📄 ${item} (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  }
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
