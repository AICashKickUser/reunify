#!/usr/bin/env node
/**
 * Build Reunify TWA v1.3.0 (versionCode: 4) using @bubblewrap/core
 * Includes: Pro page mobile fix, Timeline crash fix, clickable dashboard, owner bypass, dark mode
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const JDK_PATH = '/usr/lib/jvm/java-21-openjdk-amd64';
const BUILD_DIR = '/home/z/my-project/android-build';
const PROJECT_DIR = path.join(BUILD_DIR, 'twa-v1.3.0');
const KEYSTORE = path.join(BUILD_DIR, 'reunify-key.jks');
const KEY_PASSWORD = 'reunify123';
const KEY_ALIAS = 'reunify';

// Set up JDK
process.env.JAVA_HOME = JDK_PATH;
process.env.PATH = `${JDK_PATH}/bin:${process.env.PATH}`;

console.log('=== Building ReunifyMe TWA v1.3.0 ===\n');
console.log('JDK:', execSync('java -version 2>&1').toString().split('\n')[0]);

// Step 1: Clean up any previous project
if (fs.existsSync(PROJECT_DIR)) {
  fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PROJECT_DIR, { recursive: true });

// Step 2: Create the twa-manifest.json
const twaManifest = {
  host: 'reunify-six.vercel.app',
  name: 'ReunifyMe',
  launcherName: 'ReunifyMe',
  startUrl: '/',
  backgroundColor: '#FFFFFF',
  themeColor: '#059669',
  navigationColor: '#059669',
  navigationColorDark: '#059669',
  navigationDividerColor: '#059669',
  navigationDividerColorDark: '#059669',
  orientation: 'portrait-primary',
  display: 'standalone',
  packageId: 'com.aicashkick.reunify',
  appVersionName: '1.3.0',
  appVersionCode: 4,
  shortcuts: [],
  signingKey: {
    path: KEYSTORE,
    alias: KEY_ALIAS,
  },
  splashScreenFadeOutDuration: 300,
  enableSiteSettingsShortcut: false,
  fallbackType: 'customtabs',
  webManifestUrl: 'https://reunify-six.vercel.app/manifest.json',
  maskableIconUrl: 'https://reunify-six.vercel.app/icons/icon-512x512.png',
  fingerprintUrl: 'https://reunify-six.vercel.app/.well-known/assetlinks.json',
  additionalTrustedOrigins: [],
  features: {},
  alphaDependencies: { enabled: false },
};

// Write the manifest
fs.writeFileSync(
  path.join(PROJECT_DIR, 'twa-manifest.json'),
  JSON.stringify(twaManifest, null, 2)
);

console.log('TWA manifest created at:', path.join(PROJECT_DIR, 'twa-manifest.json'));

// Step 3: Use bubblewrap CLI to generate and build
console.log('\n--- Step 1: Generating TWA project ---\n');

try {
  execSync(`echo "No" | npx @bubblewrap/cli generate --manifest="${path.join(PROJECT_DIR, 'twa-manifest.json')}" --directory="${PROJECT_DIR}" --skipPwaValidation`, {
    cwd: PROJECT_DIR,
    stdio: 'pipe',
    env: {
      ...process.env,
      JAVA_HOME: JDK_PATH,
      PATH: `${JDK_PATH}/bin:${process.env.PATH}`,
    },
    timeout: 300000,
  });
  console.log('\nProject generated successfully!');
} catch (error) {
  console.error('Generation failed, trying with printf...');
  try {
    execSync(`printf "No\n" | npx @bubblewrap/cli generate --manifest="${path.join(PROJECT_DIR, 'twa-manifest.json')}" --directory="${PROJECT_DIR}" --skipPwaValidation`, {
      cwd: PROJECT_DIR,
      stdio: 'pipe',
      env: {
        ...process.env,
        JAVA_HOME: JDK_PATH,
        PATH: `${JDK_PATH}/bin:${process.env.PATH}`,
      },
      timeout: 300000,
    });
    console.log('\nProject generated with piped input!');
  } catch (error2) {
    console.error('Generation also failed:', error2.message);
    if (error2.stdout) console.log('STDOUT:', error2.stdout.toString());
    if (error2.stderr) console.log('STDERR:', error2.stderr.toString());
    process.exit(1);
  }
}

// Step 4: Build the project
console.log('\n--- Step 2: Building AAB ---\n');

try {
  execSync(`npx @bubblewrap/cli build --manifest="${path.join(PROJECT_DIR, 'twa-manifest.json')}" --directory="${PROJECT_DIR}"`, {
    cwd: PROJECT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      JAVA_HOME: JDK_PATH,
      PATH: `${JDK_PATH}/bin:${process.env.PATH}`,
    },
    timeout: 600000,
  });
  console.log('\nBuild completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Step 5: Copy the outputs
console.log('\n--- Step 3: Copying outputs ---\n');

const aabDest = path.join(BUILD_DIR, 'reunify-1.3.0.aab');
const apkDest = path.join(BUILD_DIR, 'reunify-1.3.0.apk');

// Try different possible output locations
const possibleAabPaths = [
  path.join(PROJECT_DIR, 'app-release-bundle.aab'),
  path.join(PROJECT_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'),
];

let aabFound = false;
for (const p of possibleAabPaths) {
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, aabDest);
    console.log(`AAB copied from ${p} to ${aabDest}`);
    aabFound = true;
    break;
  }
}

if (!aabFound) {
  console.log('Looking for AAB in project directory...');
  const findResult = execSync(`find ${PROJECT_DIR} -name "*.aab" 2>/dev/null`).toString();
  console.log('Found AAB files:', findResult);
}

const possibleApkPaths = [
  path.join(PROJECT_DIR, 'app-release-signed.apk'),
  path.join(PROJECT_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
];

let apkFound = false;
for (const p of possibleApkPaths) {
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, apkDest);
    console.log(`APK copied from ${p} to ${apkDest}`);
    apkFound = true;
    break;
  }
}

console.log('\n=== Build Complete ===');
console.log(`AAB: ${aabDest} (${aabFound ? fs.statSync(aabDest).size + ' bytes' : 'NOT FOUND'})`);
console.log(`APK: ${apkDest} (${apkFound ? fs.statSync(apkDest).size + ' bytes' : 'NOT FOUND'})`);
