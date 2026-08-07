import { NextRequest, NextResponse } from 'next/server'

// Promo codes that unlock Pro mode for testing/review
// Set via PROMO_CODES env var (comma-separated), or use these defaults
const DEFAULT_PROMO_CODES = [
  'reunify-pro-2025',    // General tester code
  'reunify-review',      // App reviewer code
  'reunify-founder',     // Founder code
]

// Promo code config: code -> { days, label }
// Allows different codes to grant different durations
const PROMO_CONFIG: Record<string, { days: number; label: string }> = {
  'reunify-pro-2025': { days: 365, label: 'Pro activated for 1 year!' },
  'reunify-review': { days: 90, label: 'Pro activated for 90 days (review access).' },
  'reunify-founder': { days: 3650, label: 'Founder Pro activated — thank you!' },
}

function getValidPromoCodes(): string[] {
  const envCodes = process.env.PROMO_CODES
  if (envCodes) {
    return envCodes.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)
  }
  return DEFAULT_PROMO_CODES
}

function getPromoConfig(code: string): { days: number; label: string } {
  return PROMO_CONFIG[code] || { days: 365, label: 'Pro activated! Enjoy all premium features.' }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body as { code: string }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Please enter a promo code.' },
        { status: 400 }
      )
    }

    const normalizedCode = code.trim().toLowerCase()
    const validCodes = getValidPromoCodes()

    if (validCodes.includes(normalizedCode)) {
      const config = getPromoConfig(normalizedCode)
      const now = new Date()
      const periodEnd = new Date(now.getTime() + config.days * 24 * 60 * 60 * 1000)

      console.log(`[stripe/promo] Activated Pro with code "${normalizedCode}" for ${config.days} days, expires ${periodEnd.toISOString()}`)

      return NextResponse.json({
        success: true,
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: periodEnd.toISOString(),
        trialEnd: null,
        message: config.label,
      })
    }

    console.log(`[stripe/promo] Invalid promo code attempted: "${normalizedCode}"`)
    return NextResponse.json(
      { error: 'Invalid promo code. Please check and try again.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[stripe/promo] Error:', error)
    return NextResponse.json(
      { error: 'Could not validate promo code.' },
      { status: 500 }
    )
  }
}
