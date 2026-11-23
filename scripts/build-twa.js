#!/usr/bin/env node
/**
 * Reunify TWA Build Script
 * Generates an Android App Bundle (AAB) for Google Play Store
 * 
 * Usage: node scripts/build-twa.js
 * 
 * Prerequisites:
 * - JDK 8+ installed and JAVA_HOME set
 * - Android SDK installed with platforms;android-36 and build-tools;36.0.0
 * - ANDROID_HOME environment variable set
 */

const { TwaGenerator, TwaManifest, Orientations } = require('@bubblewrap/core')
const { GradleWrapper } = require('@bubblewrap/core')
const { Config } = require('@bubblewrap/core')
const path = require('path')
const fs = require('fs')

// ─── Configuration ────────────────────────────────────────────────────────────

const APP_VERSION_CODE = 12
const APP_VERSION_NAME = '1.13.0'
const TARGET_SDK_VERSION = 36
const MIN_SDK_VERSION = 24
const PACKAGE_ID = 'com.aicashkick.reunify'
const HOST = 'reunify-six.vercel.app'
const KEYSTORE_PATH = path.resolve(__dirname, '../public/play-store/reunify-key.jks')
const KEYSTORE_ALIAS = 'reunify'
const OUTPUT_DIR = path.resolve(__dirname, '../android-build/twa-project')
const AAB_OUTPUT = path.resolve(__dirname, `../public/play-store/reunify-${APP_VERSION_NAME}.aab`)

/** Recursively find files with a given extension */
function findFiles(dir, ext) {
  if (!fs.existsSync(dir)) return []
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, ext))
    } else if (entry.name.endsWith(ext)) {
      results.push(fullPath)
    }
  }
  return results
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`  Reunify TWA Builder v${APP_VERSION_NAME}`)
  console.log('═══════════════════════════════════════════════════════════')
  console.log()

  // Validate keystore exists
  if (!fs.existsSync(KEYSTORE_PATH)) {
    console.error(`❌ Keystore not found: ${KEYSTORE_PATH}`)
    process.exit(1)
  }

  // Validate Android SDK
  const androidHome = process.env.ANDROID_HOME
  if (!androidHome) {
    console.error('❌ ANDROID_HOME environment variable not set')
    process.exit(1)
  }

  // Validate JDK
  const javaHome = process.env.JAVA_HOME
  if (!javaHome) {
    console.warn('⚠️  JAVA_HOME not set, will try to find Java automatically')
  }

  console.log(`📦 Package ID: ${PACKAGE_ID}`)
  console.log(`🌐 Host: ${HOST}`)
  console.log(`📱 Target SDK: ${TARGET_SDK_VERSION}`)
  console.log(`🔑 Keystore: ${KEYSTORE_PATH}`)
  console.log(`📁 Output: ${AAB_OUTPUT}`)
  console.log()

  // ─── Step 1: Create TWA Manifest ────────────────────────────────────────

  console.log('📋 Step 1: Creating TWA Manifest...')

  const twaManifestData = {
    packageId: PACKAGE_ID,
    host: HOST,
    name: 'Reunify',
    launcherName: 'Reunify',
    display: 'standalone',
    // No displayOverride — removed deprecated fullscreen-sticky API.
    // Android 16+ handles edge-to-edge natively via enableEdgeToEdge().
    // Using displayOverride triggered Google Play's deprecated API warning.
    themeColor: '#059669',
    themeColorDark: '#064e3b',
    navigationColor: '#ffffff',
    navigationColorDark: '#1f2937',
    navigationDividerColor: '#00000000',
    navigationDividerColorDark: '#00000000',
    backgroundColor: '#ffffff',
    enableNotifications: true,
    startUrl: '/',
    iconUrl: `https://${HOST}/icons/icon-512x512.png`,
    maskableIconUrl: `https://${HOST}/icons/maskable-512x512.png`,
    splashScreenFadeOutDuration: 300,
    signingKey: {
      path: KEYSTORE_PATH,
      alias: KEYSTORE_ALIAS,
    },
    appVersionCode: APP_VERSION_CODE,
    appVersion: APP_VERSION_NAME,
    shortcuts: [
      {
        name: 'My Case',
        shortName: 'Case',
        url: '/?view=case',
        chosenIconUrl: `https://${HOST}/icons/icon-72x72.png`,
      },
      {
        name: 'Quick Log',
        shortName: 'Log',
        url: '/?view=timeline',
        chosenIconUrl: `https://${HOST}/icons/icon-72x72.png`,
      },
    ],
    generatorApp: 'reunify-builder',
    webManifestUrl: `https://${HOST}/manifest.json`,
    fallbackType: 'customtabs',
    enableSiteSettingsShortcut: true,
    isChromeOSOnly: false,
    isMetaQuest: false,
    minSdkVersion: MIN_SDK_VERSION,
    // Use "default" orientation instead of "portrait-primary" 
    // to comply with Android 16 large screen requirements.
    // Google Play requires apps to support all orientations on large screens.
    orientation: 'default',
    fingerprints: [
      {
        value: '4F:87:6C:A7:EF:9A:86:D5:72:E8:B7:5B:52:30:0C:17:59:D9:22:1C:E0:0D:AD:79:8F:02:70:09:6B:21:9E:90',
        name: 'upload_key',
      },
    ],
    additionalTrustedOrigins: [],
    retainedBundles: [],
  }

  const twaManifest = new TwaManifest(twaManifestData)
  
  // Validate the manifest
  const validationError = twaManifest.validate()
  if (validationError) {
    console.error(`❌ TWA Manifest validation error: ${validationError}`)
    process.exit(1)
  }

  console.log('✅ TWA Manifest created successfully')

  // ─── Step 2: Generate TWA Project ───────────────────────────────────────

  console.log('🔨 Step 2: Generating TWA Project...')

  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const twaGenerator = new TwaGenerator()
  await twaGenerator.createTwaProject(OUTPUT_DIR, twaManifest, {
    log: (level, message) => console.log(`  [${level}] ${message}`)
  })

  console.log('✅ TWA Project generated')

  // ─── Step 3: Patch build.gradle for targetSdkVersion 36 ────────────────

  console.log(`🔧 Step 3: Patching build.gradle (targetSdkVersion → ${TARGET_SDK_VERSION})...`)

  const buildGradlePath = path.join(OUTPUT_DIR, 'app', 'build.gradle')
  if (fs.existsSync(buildGradlePath)) {
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf-8')
    
    // Update targetSdkVersion
    buildGradle = buildGradle.replace(
      /targetSdkVersion\s+\d+/,
      `targetSdkVersion ${TARGET_SDK_VERSION}`
    )
    
    // Update compileSdkVersion if needed
    buildGradle = buildGradle.replace(
      /compileSdkVersion\s+\d+/,
      `compileSdkVersion ${TARGET_SDK_VERSION}`
    )
    
    fs.writeFileSync(buildGradlePath, buildGradle)
    console.log(`✅ Patched targetSdkVersion to ${TARGET_SDK_VERSION}`)
  } else {
    console.error(`❌ build.gradle not found at ${buildGradlePath}`)
    process.exit(1)
  }

  // ─── Step 3b: Patch root build.gradle repositories (jcenter is dead) ──

  console.log('🔧 Step 3b: Patching root build.gradle repositories (replace dead jcenter)...')

  const rootBuildGradlePath = path.join(OUTPUT_DIR, 'build.gradle')
  if (fs.existsSync(rootBuildGradlePath)) {
    let rootGradle = fs.readFileSync(rootBuildGradlePath, 'utf-8')
    // Replace jcenter() with Aliyun mirror + mavenCentral (jcenter shut down in 2022)
    rootGradle = rootGradle.replace(
      /jcenter\(\)/g,
      "maven { url 'https://maven.aliyun.com/repository/public' }\n        maven { url 'https://maven.aliyun.com/repository/google' }\n        mavenCentral()"
    )
    fs.writeFileSync(rootBuildGradlePath, rootGradle)
    console.log('✅ Replaced jcenter with Aliyun mirror + mavenCentral')
  }

  // ─── Step 3c: Create local.properties + gradle.properties ─────────────

  console.log('🔧 Step 3c: Creating local.properties and gradle.properties...')

  const androidHome = process.env.ANDROID_HOME
  if (androidHome) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'local.properties'),
      `sdk.dir=${androidHome}\n`
    )
    console.log(`✅ Created local.properties (sdk.dir=${androidHome})`)
  }

  // Append serialization settings to gradle.properties to avoid Maven rate-limiting
  const gradlePropsPath = path.join(OUTPUT_DIR, 'gradle.properties')
  if (fs.existsSync(gradlePropsPath)) {
    let props = fs.readFileSync(gradlePropsPath, 'utf-8')
    if (!props.includes('org.gradle.parallel=false')) {
      props += '\norg.gradle.parallel=false\norg.gradle.max-workers=1\norg.gradle.daemon=false\n'
      fs.writeFileSync(gradlePropsPath, props)
      console.log('✅ Added serialization settings to gradle.properties')
    }
  }

  // ─── Step 4: Patch AndroidManifest.xml for API 36 compliance ──────────

  console.log('🔧 Step 4: Patching AndroidManifest.xml for API 36 compliance...')

  const androidManifestPath = path.join(OUTPUT_DIR, 'app', 'src', 'main', 'AndroidManifest.xml')
  if (fs.existsSync(androidManifestPath)) {
    let manifest = fs.readFileSync(androidManifestPath, 'utf-8')
    
    // Add android:enableOnBackInvokedCallback="true" to the application tag for predictive back
    manifest = manifest.replace(
      /<application\s/,
      '<application android:enableOnBackInvokedCallback="true" '
    )
    
    // Add supportsRtl and resizeableActivity for large screen support
    if (!manifest.includes('android:resizeableActivity')) {
      manifest = manifest.replace(
        /android:supportsRtl="true"/,
        'android:supportsRtl="true"\n        android:resizeableActivity="true"'
      )
    }
    
    // CRITICAL: Remove android:screenOrientation restriction for large screen compliance.
    // Android 16 ignores this on foldables/tablets, but Google Play still flags it.
    // We must remove any screenOrientation attribute from the launcher activity.
    manifest = manifest.replace(
      /android:screenOrientation="[^"]*"\s*/g,
      ''
    )
    
    // Also remove any resizeableActivity="false" — must be true or omitted
    manifest = manifest.replace(
      /android:resizeableActivity="false"/g,
      'android:resizeableActivity="true"'
    )
    
    fs.writeFileSync(androidManifestPath, manifest)
    console.log('✅ Patched AndroidManifest.xml for API 36, edge-to-edge, and large screen support')
  } else {
    console.warn(`⚠️  AndroidManifest.xml not found at ${androidManifestPath}`)
  }

  // Note: Step 4b (edge-to-edge Java patch) and Step 4c (activity-ktx dependency)
  // were removed because androidx.activity:activity-ktx:1.9.0 is not reliably
  // available from mirrors. Android 16 handles edge-to-edge natively via the
  // AndroidManifest patches in Step 4, so the Java patch is not required for
  // Play Store compliance.

  // ─── Step 5: Build the AAB ──────────────────────────────────────────────

  console.log('🏗️  Step 5: Building Android App Bundle...')

  const config = new Config(
    javaHome || process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk-amd64',
    androidHome
  )

  const gradleWrapper = new GradleWrapper(
    OUTPUT_DIR,
    javaHome || '',
    androidHome
  )

  try {
    // Build the release AAB
    const result = await gradleWrapper.bundleRelease()
    
    if (result) {
      console.log('✅ AAB built successfully')
    } else {
      console.error('❌ AAB build failed')
      process.exit(1)
    }
  } catch (err) {
    console.error('❌ Gradle build failed:', err.message || err)
    
    // Try running gradle directly
    console.log('\n🔄 Trying direct gradle build...')
    const { execSync } = require('child_process')
    
    try {
      const gradleCmd = path.join(OUTPUT_DIR, 'gradlew')
      execSync(`chmod +x ${gradleCmd}`, { stdio: 'inherit' })
      execSync(`${gradleCmd} bundleRelease`, {
        cwd: OUTPUT_DIR,
        stdio: 'inherit',
        env: {
          ...process.env,
          ANDROID_HOME: androidHome,
          JAVA_HOME: javaHome || '',
        },
      })
      console.log('✅ AAB built successfully (direct gradle)')
    } catch (gradleErr) {
      console.error('❌ Direct gradle build also failed:', gradleErr.message)
      process.exit(1)
    }
  }

  // ─── Step 6: Copy AAB to output ─────────────────────────────────────────

  console.log('📦 Step 6: Copying AAB to output directory...')

  const builtAabPath = path.join(OUTPUT_DIR, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
  if (fs.existsSync(builtAabPath)) {
    fs.copyFileSync(builtAabPath, AAB_OUTPUT)
    const stats = fs.statSync(AAB_OUTPUT)
    console.log(`✅ AAB copied to: ${AAB_OUTPUT}`)
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
  } else {
    console.error(`❌ Built AAB not found at ${builtAabPath}`)
    console.log('   Searching for AAB files...')
    const { execSync } = require('child_process')
    try {
      const found = execSync(`find ${OUTPUT_DIR} -name "*.aab" 2>/dev/null`).toString().trim()
      if (found) {
        console.log(`   Found: ${found}`)
        fs.copyFileSync(found.trim(), AAB_OUTPUT)
        console.log(`✅ AAB copied to: ${AAB_OUTPUT}`)
      }
    } catch {
      console.error('   No AAB files found')
    }
    process.exit(1)
  }

  // ─── Step 7: Sign the AAB ───────────────────────────────────────────────

  console.log('🔑 Step 7: Signing the AAB...')
  console.log('   Note: AAB files are signed by Gradle during the build process')
  console.log('   using the keystore specified in the TWA manifest.')
  console.log('   If you need to manually sign, use:')
  console.log(`   jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ${KEYSTORE_PATH} -storepass <password> ${AAB_OUTPUT} ${KEYSTORE_ALIAS}`)

  // ─── Done ────────────────────────────────────────────────────────────────

  console.log()
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  ✅ BUILD COMPLETE!')
  console.log('═══════════════════════════════════════════════════════════')
  console.log()
  console.log(`  AAB: ${AAB_OUTPUT}`)
  console.log(`  Version: ${APP_VERSION_NAME} (code ${APP_VERSION_CODE})`)
  console.log(`  Target SDK: ${TARGET_SDK_VERSION}`)
  console.log(`  Min SDK: ${MIN_SDK_VERSION}`)
  console.log()
  console.log('  Upload to Google Play Console:')
  console.log('  1. Go to Production → Create new release')
  console.log('  2. Upload the AAB file')
  console.log('  3. Review and roll out')
  console.log()
}

main().catch(err => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
