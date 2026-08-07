import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'Payment system is being set up. Please try again later.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { customerId } = body as { customerId: string }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSecretKey)

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/portal] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Could not open billing portal: ${errMsg}` },
      { status: 500 }
    )
  }
}
