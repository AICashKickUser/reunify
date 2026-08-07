import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const priceMonthly = process.env.STRIPE_PRICE_MONTHLY
    const priceAnnual = process.env.STRIPE_PRICE_ANNUAL

    if (!stripeSecretKey || !priceMonthly) {
      const missing = []
      if (!stripeSecretKey) missing.push('STRIPE_SECRET_KEY')
      if (!priceMonthly) missing.push('STRIPE_PRICE_MONTHLY')
      console.error('[stripe/checkout] Missing env vars:', missing.join(', '))
      return NextResponse.json(
        { error: 'Payment system is being set up. Please try again later or use a promo code.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { plan = 'monthly' } = body as { plan: 'monthly' | 'annual' }

    const priceId = plan === 'annual' ? (priceAnnual || priceMonthly) : priceMonthly

    // Dynamically import Stripe to avoid build errors if not configured
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          app: 'reunify',
        },
      },
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
      metadata: {
        plan,
      },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('[stripe/checkout] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Could not start checkout: ${errMsg}` },
      { status: 500 }
    )
  }
}
