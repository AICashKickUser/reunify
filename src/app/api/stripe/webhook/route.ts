import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      )
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' })

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown signature error'
      console.error('[stripe/webhook] Signature verification failed:', errMsg)
      return NextResponse.json({ error: errMsg }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Record<string, unknown>
        console.log('[stripe/webhook] Checkout completed:', session.id, 'customer:', session.customer)
        // The client will poll the status API after checkout success redirect
        // The status API reads live from Stripe, so no server-side state needed
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Record<string, unknown>
        console.log('[stripe/webhook] Subscription updated:', subscription.id, 'status:', subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Record<string, unknown>
        console.log('[stripe/webhook] Subscription deleted:', subscription.id)
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Record<string, unknown>
        console.log('[stripe/webhook] Subscription created:', subscription.id, 'status:', subscription.status)
        break
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[stripe/webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
