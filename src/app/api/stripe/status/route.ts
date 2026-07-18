import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json() as { sessionId: string }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the checkout session to verify it was successful
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
      return NextResponse.json({ status: 'pending' })
    }

    // Get the subscription
    const subscriptionId = session.subscription as string
    if (!subscriptionId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    return NextResponse.json({
      status: 'active',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  } catch (error) {
    console.error('Stripe status check error:', error)
    return NextResponse.json({ error: 'Failed to check subscription status' }, { status: 500 })
  }
}
