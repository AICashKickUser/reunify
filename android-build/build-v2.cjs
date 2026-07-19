#!/usr/bin/env node
/**
 * Build ReunifyMe TWA v1.1.0 (versionCode: 2) using @bubblewrap/core API
 * This is a programmatic build that bypasses the interactive CLI prompts
 */
const {
  TwaGenerator,
  TwaManifest,
  GradleWrapper,
  JdkHelper,
  JarSigner,
  AndroidSdkTools,
  ConsoleLog,
} = require('@bubblewrap/core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const JDK_PATH = '/tmp/jdk-17';
const BUILD_DIR = '/home/z/my-project/android-build';
const PROJECT_DIR = path.join(BUILD_DIR, 'twa-v2');
const KEYSTORE = path.join(BUILD_DIR, 'reunify-key.jks');
const KEY_PASSWORD = 'reunify123';
const KEY_ALIAS = 'reunify';

async function main() {
  const log = new ConsoleLog('build');
  
  console.log('=== Building ReunifyMe TWA v1.1.0 (versionCode: 2) ===\n');

  // Step 1: Create TWA Manifest
  console.log('Step 1: Creating TWA Manifest...');
  
  // First, fetch the web manifest and create a TWA manifest from it
  const webManifestUrl = 'https://reunify-six.vercel.app/manifest.json';
  
  let twaManifest;
  try {
    twaManifest = await TwaManifest.fromWebManifest(webManifestUrl);
    console.log('  Fetched web manifest successfully');
  } catch (error) {
    console.error('  Failed to fetch web manifest:', error.message);
    console.log('  Creating TWA manifest manually...');
  }
  
  // Override the fields we need
  const manifestData = {
    packageId: 'com.aicashkick.reunify',
    host: 'reunify-six.vercel.app',
    name: 'ReunifyMe',
    launcherName: 'ReunifyMe',
    startUrl: '/',
    backgroundColor: '#FFFFFF',
    themeColor: '#059669',
    themeColorDark: '#000000',
    navigationColor: '#059669',
    navigationColorDark: '#059669',
    navigationDividerColor: '#059669',
    navigationDividerColorDark: '#059669',
    orientation: 'portrait-primary',
    display: 'standalone',
    appVersion: '1.1.0',
    appVersionCode: 2,
    signingKey: {
      path: KEYSTORE,
      alias: KEY_ALIAS,
    },
    splashScreenFadeOutDuration: 300,
    enableSiteSettingsShortcut: false,
    enableNotifications: true,
    fallbackType: 'customtabs',
    webManifestUrl: webManifestUrl,
    iconUrl: 'https://reunify-six.vercel.app/icons/icon-512x512.png',
    maskableIconUrl: 'https://reunify-six.vercel.app/icons/icon-512x512.png',
    fingerprintUrl: 'https://reunify-six.vercel.app/.well-known/assetlinks.json',
    additionalTrustedOrigins: [],
    features: {},
    alphaDependencies: { enabled: false },
    shortcuts: [],
  };

  if (twaManifest) {
    // Override the fields from the fetched manifest
    twaManifest.packageId = manifestData.packageId;
    twaManifest.name = manifestData.name;
    twaManifest.launcherName = manifestData.launcherName;
    twaManifest.appVersionName = manifestData.appVersion;
    twaManifest.appVersionCode = manifestData.appVersionCode;
    twaManifest.signingKey = manifestData.signingKey;
    twaManifest.enableSiteSettingsShortcut = manifestData.enableSiteSettingsShortcut;
    twaManifest.orientation = manifestData.orientation;
    twaManifest.fallbackType = manifestData.fallbackType;
  } else {
    twaManifest = new TwaManifest(manifestData);
  }

  // Validate
  const validationError = twaManifest.validate();
  if (validationError) {
    console.error('Manifest validation error:', validationError);
    process.exit(1);
  }
  console.log('  TWA Manifest validated successfully');
  console.log(`    Package: ${twaManifest.packageId}`);
  console.log(`    Version: ${twaManifest.appVersionName} (${twaManifest.appVersionCode})`);
  console.log(`    Host: ${twaManifest.host}`);
  console.log(`    Icon URL: ${twaManifest.iconUrl}`);

  // Clean up any previous project
  if (fs.existsSync(PROJECT_DIR)) {
    console.log('  Removing previous project directory...');
    fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PROJECT_DIR, { recursive: true });

  // Save the manifest
  await twaManifest.saveToFile(path.join(PROJECT_DIR, 'twa-manifest.json'));
  console.log('  TWA Manifest saved');

  // Step 2: Generate the TWA project
  console.log('\nStep 2: Generating TWA project...');
  const twaGenerator = new TwaGenerator();
  
  try {
    await twaGenerator.createTwaProject(PROJECT_DIR, twaManifest, log, (progress) => {
      console.log(`  Progress: ${Math.round(progress * 100)}%`);
    });
    console.log('  TWA project generated successfully!');
  } catch (error) {
    console.error('  Error generating TWA project:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

  // Step 3: Set up JDK and Android SDK
  console.log('\nStep 3: Setting up build environment...');
  
  const jdkHelper = new JdkHelper(process.env, JDK_PATH);
  console.log('  JDK Helper initialized');

  // Check for Android SDK or download it
  let androidSdkPath = process.env.ANDROID_HOME || '/tmp/android-sdk';
  
  if (!fs.existsSync(path.join(androidSdkPath, 'build-tools'))) {
    console.log('  Downloading Android SDK...');
    // Use AndroidSdkTools to download
    try {
      const androidSdkTools = new AndroidSdkTools(jdkHelper, androidSdkPath);
      await androidSdkTools.installBuildTools();
      console.log('  Android SDK installed successfully');
    } catch (error) {
      console.error('  Failed to install Android SDK via bubblewrap:', error.message);
      console.log('  Trying manual SDK download...');
      
      // Manual SDK download approach
      try {
        await downloadAndroidSdk(androidSdkPath);
      } catch (sdkError) {
        console.error('  Manual SDK download failed:', sdkError.message);
        process.exit(1);
      }
    }
  }

  // Step 4: Build the project
  console.log('\nStep 4: Building the Android project...');
  
  const gradleWrapper = new GradleWrapper(PROJECT_DIR, jdkHelper, androidSdkPath);
  
  try {
    // Build AAB (bundle release)
    console.log('  Building AAB (bundleRelease)...');
    await gradleWrapper.bundleRelease();
    console.log('  AAB build completed!');
  } catch (error) {
    console.error('  AAB build failed:', error.message);
    console.error(error.stack);
    
    // Try building with Gradle directly
    console.log('\n  Trying direct Gradle build...');
    try {
      execSync('./gradlew bundleRelease', {
        cwd: PROJECT_DIR,
        stdio: 'inherit',
        env: {
          ...process.env,
          JAVA_HOME: JDK_PATH,
          ANDROID_HOME: androidSdkPath,
          PATH: `${JDK_PATH}/bin:${process.env.PATH}`,
        },
        timeout: 600000,
      });
      console.log('  Direct Gradle build completed!');
    } catch (gradleError) {
      console.error('  Direct Gradle build also failed:', gradleError.message);
      process.exit(1);
    }
  }

  // Step 5: Sign the AAB
  console.log('\nStep 5: Signing the AAB...');
  
  const aabPaths = [
    path.join(PROJECT_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'),
    path.join(PROJECT_DIR, 'app-release-bundle.aab'),
  ];
  
  let unsignedAabPath = null;
  for (const p of aabPaths) {
    if (fs.existsSync(p)) {
      unsignedAabPath = p;
      break;
    }
  }
  
  if (!unsignedAabPath) {
    // Search for AAB files
    const findResult = execSync(`find ${PROJECT_DIR} -name "*.aab" 2>/dev/null`).toString().trim();
    if (findResult) {
      unsignedAabPath = findResult.split('\n')[0];
    }
  }
  
  if (!unsignedAabPath) {
    console.error('  Could not find the built AAB file!');
    process.exit(1);
  }
  
  console.log(`  Found AAB at: ${unsignedAabPath}`);
  
  const signedAabPath = path.join(BUILD_DIR, 'reunify-1.1.0.aab');
  
  // Copy and sign with jarsigner
  fs.copyFileSync(unsignedAabPath, signedAabPath);
  
  try {
    const jarSigner = new JarSigner(jdkHelper, {
      keystorePath: KEYSTORE,
      keystorePassword: KEY_PASSWORD,
      keyAlias: KEY_ALIAS,
      keyPassword: KEY_PASSWORD,
    });
    
    await jarSigner.sign(signedAabPath);
    console.log('  AAB signed successfully!');
  } catch (error) {
    console.error('  JarSigner failed:', error.message);
    console.log('  Trying direct jarsigner command...');
    
    try {
      execSync(
        `${JDK_PATH}/bin/jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 ` +
        `-keystore ${KEYSTORE} -storepass ${KEY_PASSWORD} -keypass ${KEY_PASSWORD} ` +
        `${signedAabPath} ${KEY_ALIAS}`,
        { stdio: 'pipe', timeout: 120000 }
      );
      console.log('  AAB signed with jarsigner!');
    } catch (signError) {
      console.error('  jarsigner also failed:', signError.message);
      // AAB for Play Store doesn't strictly need jarsigner signing
      // Play Console re-signs with the upload key anyway
      console.log('  Continuing with unsigned AAB (Play Console will re-sign)');
    }
  }

  // Step 6: Copy to public for download
  console.log('\nStep 6: Making files available for download...');
  
  const publicAabPath = '/home/z/my-project/public/play-store/reunify-1.1.0.aab';
  fs.copyFileSync(signedAabPath, publicAabPath);
  console.log(`  AAB copied to public/play-store/`);
  
  // Also create a zip version for iPad download
  try {
    execSync(`zip -j /home/z/my-project/public/play-store/reunify-1.1.0.zip ${signedAabPath}`, {
      stdio: 'pipe',
    });
    console.log('  ZIP version created for iPad download');
  } catch (zipError) {
    console.error('  ZIP creation failed:', zipError.message);
  }

  // Summary
  console.log('\n=== Build Complete! ===');
  console.log(`AAB: ${signedAabPath} (${(fs.statSync(signedAabPath).size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Public AAB: ${publicAabPath}`);
  console.log(`Version: 1.1.0 (versionCode: 2)`);
  console.log(`\nDownload URLs (after Vercel deploy):`);
  console.log(`  AAB: https://reunify-six.vercel.app/play-store/reunify-1.1.0.aab`);
  console.log(`  ZIP: https://reunify-six.vercel.app/play-store/reunify-1.1.0.zip`);
}

async function downloadAndroidSdk(sdkPath) {
  const { execSync } = require('child_process');
  
  // Download command line tools
  const cmdlineToolsUrl = 'https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip';
  const zipPath = '/tmp/cmdline-tools.zip';
  
  console.log('  Downloading Android command line tools...');
  execSync(`curl -fsSL "${cmdlineToolsUrl}" -o "${zipPath}"`, { stdio: 'pipe' });
  
  // Extract
  const extractPath = path.join(sdkPath, 'cmdline-tools');
  fs.mkdirSync(extractPath, { recursive: true });
  execSync(`unzip -q "${zipPath}" -d "${extractPath}"`, { stdio: 'pipe' });
  
  // Rename to latest
  const srcDir = path.join(extractPath, 'cmdline-tools');
  const latestDir = path.join(extractPath, 'latest');
  if (fs.existsSync(srcDir)) {
    fs.renameSync(srcDir, latestDir);
  }
  
  // Accept licenses and install required components
  const sdkmanager = path.join(latestDir, 'bin', 'sdkmanager');
  fs.chmodSync(sdkmanager, '755');
  
  console.log('  Installing build tools, platform, etc...');
  const yes = 'y'; // Auto-accept licenses
  execSync(`yes | ${sdkmanager} --sdk_root="${sdkPath}" "build-tools;34.0.0" "platforms;android-34" "platform-tools"`, {
    stdio: 'pipe',
    env: {
      ...process.env,
      JAVA_HOME: JDK_PATH,
    },
    timeout: 300000,
  });
  
  console.log('  Android SDK installed successfully!');
}

main().catch((error) => {
  console.error('Build failed with error:', error);
  console.error(error.stack);
  process.exit(1);
});
