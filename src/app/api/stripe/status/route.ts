import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json({ configured: false, tier: 'free', status: 'inactive' })
    }

    const customerId = request.nextUrl.searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ configured: true, tier: 'free', status: 'inactive' })
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })

    // Get the customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    })

    const sub = subscriptions.data[0]

    if (!sub) {
      return NextResponse.json({
        configured: true,
        tier: 'free',
        status: 'inactive',
        customerId,
      })
    }

    const isActive = sub.status === 'active' || sub.status === 'trialing'

    return NextResponse.json({
      configured: true,
      tier: isActive ? 'pro' : 'free',
      status: sub.status,
      customerId,
      subscriptionId: sub.id,
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    })
  } catch (error) {
    console.error('[stripe/status] Error:', error)
    return NextResponse.json({ configured: false, tier: 'free', status: 'inactive' })
  }
}
