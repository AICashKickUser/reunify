import { NextRequest, NextResponse } from 'next/server'

// Promo codes that unlock Pro mode for testing/review
// Set via PROMO_CODES env var (comma-separated), or use these defaults
const DEFAULT_PROMO_CODES = [
  'reunify-pro-2025',    // General tester code
  'reunify-review',      // App reviewer code
  'reunify-founder',     // Founder code
]

function getValidPromoCodes(): string[] {
  const envCodes = process.env.PROMO_CODES
  if (envCodes) {
    return envCodes.split(',').map(c => c.trim()).filter(Boolean)
  }
  return DEFAULT_PROMO_CODES
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
      // Activate Pro via promo code - 1 year access
      const now = new Date()
      const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

      return NextResponse.json({
        success: true,
        tier: 'pro',
        status: 'active',
        currentPeriodEnd: periodEnd.toISOString(),
        trialEnd: null,
        message: 'Pro activated! Enjoy all premium features.',
      })
    }

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
