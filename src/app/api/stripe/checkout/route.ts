import { stripe, STRIPE_PRICES, BillingPeriod } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { billingPeriod } = await request.json() as { billingPeriod: BillingPeriod }

    if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    const priceId = STRIPE_PRICES[billingPeriod]
    if (!priceId) {
      // Check what's missing
      const missing = []
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
        missing.push('STRIPE_SECRET_KEY')
      }
      if (!process.env.STRIPE_PRICE_MONTHLY_ID) missing.push('STRIPE_PRICE_MONTHLY_ID')
      if (!process.env.STRIPE_PRICE_YEARLY_ID) missing.push('STRIPE_PRICE_YEARLY_ID')

      return NextResponse.json({
        error: 'Payment not configured yet',
        detail: `Missing environment variables: ${missing.join(', ')}. Please set these in your Vercel dashboard.`,
        missing,
      }, { status: 503 })
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancel`,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          app: 'reunify',
        },
      },
      metadata: {
        app: 'reunify',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Stripe checkout error:', error)
    
    let errorMessage = 'Failed to create checkout session'
    let errorDetail = ''
    
    if (error && typeof error === 'object' && 'message' in error) {
      errorDetail = (error as { message: string }).message
    }
    if (error && typeof error === 'object' && 'type' in error) {
      const type = (error as { type: string }).type
      if (type === 'StripeAuthenticationError') {
        errorMessage = 'Stripe API key is invalid'
        errorDetail = 'The STRIPE_SECRET_KEY is incorrect or has been revoked. Please check your Stripe Dashboard and update the key in Vercel environment variables.'
      } else if (type === 'StripeInvalidRequestError') {
        errorMessage = 'Invalid Stripe request'
        errorDetail = errorDetail || 'The price ID may be incorrect. Please verify STRIPE_PRICE_MONTHLY_ID and STRIPE_PRICE_YEARLY_ID in your Vercel environment variables.'
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      detail: errorDetail,
    }, { status: 500 })
  }
}
