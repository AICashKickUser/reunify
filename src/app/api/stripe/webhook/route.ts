import { stripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

// This handles Stripe webhook events (subscription created, canceled, etc.)
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('✅ Checkout completed:', session.id)
        // In a full app, you'd save subscription data to your database here
        // linked to a user account. For now, the client handles it.
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object
        console.log('✅ Subscription created:', subscription.id)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('📝 Subscription updated:', subscription.id, 'Status:', subscription.status)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('❌ Subscription canceled:', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('💰 Payment succeeded:', invoice.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('⚠️ Payment failed:', invoice.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
