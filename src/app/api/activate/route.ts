import { NextRequest, NextResponse } from 'next/server'

// Server-side activation code validation
// This keeps the actual codes secret - they're never exposed in the client JS bundle

interface ActivationResult {
  valid: boolean
  tier?: 'pro'
  stripeSessionId?: string
  subscriptionStatus?: string
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
  label?: string
  error?: string
}

// Valid activation codes - stored ONLY on the server, never sent to client
const ACTIVATION_CODES: Record<string, {
  tier: 'pro'
  stripeSessionId: string
  durationDays: number
  label: string
}> = {
  'reunify-owner-2024': {
    tier: 'pro',
    stripeSessionId: 'owner-activation',
    durationDays: 365,  // 1 year for owner
    label: 'Owner Access',
  },
  'reunify-tester-2025': {
    tier: 'pro',
    stripeSessionId: 'tester-activation',
    durationDays: 365,  // 1 year for testers (incentive for 14-day testing commitment)
    label: 'Tester Pro Access',
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = (body.code as string)?.trim()

    if (!code) {
      return NextResponse.json({
        valid: false,
        error: 'Please enter an activation code.',
      }, { status: 400 })
    }

    const activation = ACTIVATION_CODES[code]

    if (!activation) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid activation code. Please check the code and try again.',
      }, { status: 404 })
    }

    // Calculate expiration based on duration
    const currentPeriodEnd = Math.floor(Date.now() / 1000) + (activation.durationDays * 24 * 60 * 60)

    const result: ActivationResult = {
      valid: true,
      tier: activation.tier,
      stripeSessionId: activation.stripeSessionId,
      subscriptionStatus: 'active',
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      label: activation.label,
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({
      valid: false,
      error: 'Something went wrong. Please try again.',
    }, { status: 500 })
  }
}
