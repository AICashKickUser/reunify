#!/usr/bin/env node
/**
 * Build TWA Android App Bundle for Reunify
 * Version 1.1.0 (versionCode: 2) - Incremented for Play Store update
 */

import { generateTwaProject, buildTwaProject, signTwaProject } from '@bubblewrap/core';
import { KeyTool } from '@bubblewrap/core';
import { JdkHelper } from '@bubblewrap/core';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);

const PROJECT_DIR = '/home/z/my-project/android-build/twa-project-v2';
const OUTPUT_DIR = '/home/z/my-project/android-build';
const JDK_PATH = '/tmp/jdk-17';
const KEYSTORE_PATH = '/home/z/my-project/android-build/reunify-key.jks';
const KEYSTORE_PASSWORD = 'reunify123';
const KEY_ALIAS = 'reunify';
const KEY_PASSWORD = 'reunify123';

const MANIFEST_URL = 'https://reunify-six.vercel.app/manifest.json';

async function main() {
  console.log('=== Building Reunify TWA v1.1.0 (versionCode: 2) ===\n');

  // Set up JDK environment
  process.env.JAVA_HOME = JDK_PATH;
  process.env.PATH = `${JDK_PATH}/bin:${process.env.PATH}`;

  console.log('1. Creating TWA project...');

  // TWA Project configuration
  const twaManifest = {
    host: 'reunify-six.vercel.app',
    name: 'ReunifyMe',
    launcherName: 'ReunifyMe',
    startUrl: '/',
    backgroundColor: '#ffffff',
    themeColor: '#059669',
    navigationColor: '#059669',
    navigationColorDark: '#059669',
    navigationDividerColor: '#059669',
    navigationDividerColorDark: '#059669',
    orientation: 'portrait-primary',
    display: 'standalone',
    packageId: 'com.aicashkick.reunify',
    themeColorHex: '#059669',
    backgroundColorHex: '#ffffff',
    appVersionName: '1.1.0',
    appVersionCode: 2,
    shortcuts: [],
    signingKey: {
      path: KEYSTORE_PATH,
      alias: KEY_ALIAS,
    },
    splashScreenFadeOutDuration: 300,
    enableSiteSettingsShortcut: false,
    fallbackType: 'customtabs',
    webManifestUrl: MANIFEST_URL,
    maskableIconUrl: 'https://reunify-six.vercel.app/icons/icon-512x512.png',
    monochromeIconUrl: undefined,
    fingerprintUrl: 'https://reunify-six.vercel.app/.well-known/assetlinks.json',
    additionalTrustedOrigins: [],
    features: {},
    alphaDependencies: {
      enabled: false,
    },
    shareTarget: undefined,
};

  // Generate TWA project using bubblewrap
  try {
    const { generateTwaProject } = await import('@bubblewrap/core');
    
    // Check if project directory already exists
    if (fs.existsSync(PROJECT_DIR)) {
      console.log('  Removing existing project directory...');
      fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
    }

    console.log('  Generating project from manifest...');
    
    // Use the generateTwaProject function
    const result = await generateTwaProject(
      {
        manifestUrl: MANIFEST_URL,
        targetDirectory: PROJECT_DIR,
        twaManifest: twaManifest,
      },
      console.log
    );

    console.log('  Project generated successfully!');
  } catch (error) {
    console.error('Error generating TWA project:', error.message);
    console.log('\nTrying alternative approach...');
    
    // If generateTwaProject fails, try using the CLI approach
    await buildAlternative();
    return;
  }

  // Build the project
  console.log('\n2. Building Android project...');
  try {
    const result = await buildTwaProject(PROJECT_DIR, JDK_PATH, console.log);
    console.log('  Build completed!');
  } catch (error) {
    console.error('Error building project:', error.message);
    process.exit(1);
  }

  // Sign the AAB
  console.log('\n3. Signing AAB...');
  try {
    const unsignedAab = path.join(PROJECT_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
    const signedAab = path.join(OUTPUT_DIR, 'reunify-1.1.0.aab');

    // Use jarsigner to sign
    const { execSync } = await import('child_process');
    
    // First copy the unsigned AAB
    fs.copyFileSync(unsignedAab, signedAab);
    
    // Sign with apksigner or jarsigner
    execSync(
      `${JDK_PATH}/bin/jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ${KEYSTORE_PATH} -storepass ${KEYSTORE_PASSWORD} -keypass ${KEY_PASSWORD} ${signedAab} ${KEY_ALIAS}`,
      { stdio: 'inherit' }
    );

    console.log(`  Signed AAB saved to: ${signedAab}`);
    
    // Also build APK for testing
    console.log('\n4. Building signed APK...');
    const unsignedApk = path.join(PROJECT_DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
    if (fs.existsSync(unsignedApk)) {
      const signedApk = path.join(OUTPUT_DIR, 'reunify-1.1.0.apk');
      
      // Zipalign
      const buildTools = path.join(PROJECT_DIR, 'android-sdk', 'build-tools');
      const buildToolsDir = fs.readdirSync(buildTools)[0];
      const zipalign = path.join(buildTools, buildToolsDir, 'zipalign');
      const alignedApk = path.join(OUTPUT_DIR, 'reunify-aligned.apk');
      
      execSync(`${zipalign} -f 4 ${unsignedApk} ${alignedApk}`, { stdio: 'inherit' });
      
      // Sign with apksigner
      const apksigner = path.join(buildTools, buildToolsDir, 'apksigner');
      execSync(
        `${apksigner} sign --ks ${KEYSTORE_PATH} --ks-key-alias ${KEY_ALIAS} --ks-pass pass:${KEYSTORE_PASSWORD} --key-pass pass:${KEY_PASSWORD} --out ${signedApk} ${alignedApk}`,
        { stdio: 'inherit' }
      );
      
      // Clean up
      fs.unlinkSync(alignedApk);
      
      console.log(`  Signed APK saved to: ${signedApk}`);
    }
    
    console.log('\n=== Build Complete! ===');
    console.log(`AAB: ${path.join(OUTPUT_DIR, 'reunify-1.1.0.aab')}`);
    if (fs.existsSync(path.join(OUTPUT_DIR, 'reunify-1.1.0.apk'))) {
      console.log(`APK: ${path.join(OUTPUT_DIR, 'reunify-1.1.0.apk')}`);
    }
  } catch (error) {
    console.error('Error signing AAB:', error.message);
    process.exit(1);
  }
}

async function buildAlternative() {
  const { execSync } = await import('child_process');
  
  console.log('Using bubblewrap CLI approach...');
  
  // Set up environment
  process.env.JAVA_HOME = JDK_PATH;
  process.env.PATH = `${JDK_PATH}/bin:${process.env.PATH}`;
  
  // Create project directory
  if (fs.existsSync(PROJECT_DIR)) {
    fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PROJECT_DIR, { recursive: true });
  
  // Use bubblewrap CLI with input
  const answers = [
    MANIFEST_URL,           // Web Manifest URL
    PROJECT_DIR,            // Directory
    'com.aicashkick.reunify', // Package name
    'ReunifyMe',            // App name
    'ReunifyMe',            // Launcher name
    '#059669',              // Background color
    '#059669',              // Theme color
    KEYSTORE_PATH,          // Keystore path
    KEY_ALIAS,              // Key alias
    KEYSTORE_PASSWORD,      // Keystore password
    KEY_PASSWORD,           // Key password
    'y',                    // Confirm
  ].join('\n');
  
  try {
    // Try with npx
    execSync(`npx @bubblewrap/cli init`, {
      input: answers,
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: PROJECT_DIR,
      env: {
        ...process.env,
        JAVA_HOME: JDK_PATH,
        PATH: `${JDK_PATH}/bin:${process.env.PATH}`,
      },
      timeout: 300000,
    });
  } catch (error) {
    console.error('CLI approach failed:', error.message);
    
    // Last resort: create the Android project manually
    await createManualProject();
  }
  
  // Build
  console.log('\nBuilding project...');
  try {
    execSync(`npx @bubblewrap/cli build`, {
      cwd: PROJECT_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        JAVA_HOME: JDK_PATH,
        PATH: `${JDK_PATH}/bin:${process.env.PATH}`,
      },
      timeout: 600000,
    });
  } catch (error) {
    console.error('Build failed:', error.message);
  }
}

async function createManualProject() {
  console.log('Creating Android project manually...');
  const { execSync } = await import('child_process');
  
  // This creates a minimal TWA project from scratch
  // using the Android project template structure
  
  const projectDir = PROJECT_DIR;
  const appDir = path.join(projectDir, 'app');
  const mainDir = path.join(appDir, 'src', 'main');
  const resDir = path.join(mainDir, 'res');
  
  // Create directory structure
  fs.mkdirSync(path.join(mainDir, 'java', 'com', 'aicashkick', 'reunify'), { recursive: true });
  fs.mkdirSync(path.join(resDir, 'values'), { recursive: true });
  fs.mkdirSync(path.join(resDir, 'mipmap-hdpi'), { recursive: true });
  fs.mkdirSync(path.join(resDir, 'mipmap-mdpi'), { recursive: true });
  fs.mkdirSync(path.join(resDir, 'mipmap-xhdpi'), { recursive: true });
  fs.mkdirSync(path.join(resDir, 'mipmap-xxhdpi'), { recursive: true });
  fs.mkdirSync(path.join(resDir, 'mipmap-xxxhdpi'), { recursive: true });
  
  // settings.gradle
  fs.writeFileSync(path.join(projectDir, 'settings.gradle'), `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
rootProject.name = "ReunifyMe"
include ':app'
`);
  
  // build.gradle (project)
  fs.writeFileSync(path.join(projectDir, 'build.gradle'), `
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`);
  
  // build.gradle (app)
  fs.writeFileSync(path.join(appDir, 'build.gradle'), `
plugins {
    id 'com.android.application'
}
android {
    namespace 'com.aicashkick.reunify'
    compileSdk 34
    defaultConfig {
        applicationId "com.aicashkick.reunify"
        minSdk 21
        targetSdk 34
        versionCode 2
        versionName "1.1.0"
    }
    buildTypes {
        release {
            minifyEnabled true
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}
dependencies {
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
`);
  
  // AndroidManifest.xml
  fs.writeFileSync(path.join(mainDir, 'AndroidManifest.xml'), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="ReunifyMe"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.Translucent.NoTitleBar">
        <meta-data android:name="asset_statements" android:resource="@string/asset_statements"/>
        <activity android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="ReunifyMe"
            android:exported="true">
            <meta-data android:name="android.support.customtabs.trusted.DEFAULT_URL" android:value="https://reunify-six.vercel.app/" />
            <meta-data android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR" android:resource="@color/themeColor" />
            <meta-data android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR" android:resource="@color/themeColor" />
            <meta-data android:name="android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE" android:resource="@drawable/splash"/>
            <meta-data android:name="android.support.customtabs.trusted.SCREEN_ORIENTATION" android:value="portrait"/>
            <meta-data android:name="android.support.customtabs.trusted.FALLBACK_STRATEGY" android:value="customtabs"/>
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW"/>
                <category android:name="android.intent.category.DEFAULT"/>
                <category android:name="android.intent.category.BROWSABLE"/>
                <data android:scheme="https" android:host="reunify-six.vercel.app"/>
            </intent-filter>
        </activity>
        <service android:name="com.google.androidbrowserhelper.trusted.DelegationService" android:exported="true">
            <intent-filter>
                <action android:name="android.support.customtabs.trusted.TRUSTED_WEB_ACTIVITY_SERVICE"/>
                <category android:name="android.intent.category.DEFAULT"/>
            </intent-filter>
        </service>
    </application>
</manifest>
`);
  
  // strings.xml
  fs.writeFileSync(path.join(resDir, 'values', 'strings.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ReunifyMe</string>
    <string name="asset_statements">
        [{
            \\"relation\\": [\\"delegate_permission/common.handle_all_urls\\"],
            \\"target\\": {
                \\"namespace\\": \\"web\\",
                \\"site\\": \\"https://reunify-six.vercel.app\\"
            }
        }]
    </string>
</resources>
`);
  
  // colors.xml
  fs.writeFileSync(path.join(resDir, 'values', 'colors.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="themeColor">#059669</color>
    <color name="backgroundColor">#FFFFFF</color>
</resources>
`);

  // Copy icons
  const iconSizes = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
  };
  
  const iconsDir = '/home/z/my-project/public/icons';
  for (const [density, size] of Object.entries(iconSizes)) {
    const srcIcon = path.join(iconsDir, `icon-${size}x${size}.png`);
    const dstDir = path.join(resDir, `mipmap-${density}`);
    if (fs.existsSync(srcIcon)) {
      fs.copyFileSync(srcIcon, path.join(dstDir, 'ic_launcher.png'));
    }
  }
  
  // Create a simple splash drawable
  fs.mkdirSync(path.join(resDir, 'drawable'), { recursive: true });
  fs.writeFileSync(path.join(resDir, 'drawable', 'splash.xml'), `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/backgroundColor"/>
</layer-list>
`);
  
  // gradle.properties
  fs.writeFileSync(path.join(projectDir, 'gradle.properties'), `
android.useAndroidX=true
org.gradle.jvmargs=-Xmx2048m
`);
  
  // gradle wrapper
  const gradleWrapperDir = path.join(projectDir, 'gradle', 'wrapper');
  fs.mkdirSync(gradleWrapperDir, { recursive: true });
  fs.writeFileSync(path.join(gradleWrapperDir, 'gradle-wrapper.properties'), `
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.0-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

  // gradlew
  fs.writeFileSync(path.join(projectDir, 'gradlew'), `#!/bin/sh
exec gradle "$@"
`);
  
  console.log('  Manual project created!');
}

main().catch(console.error);
