import { NextResponse } from 'next/server'

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    return NextResponse.json({
      configured: false,
      publishableKey: null,
    })
  }

  return NextResponse.json({
    configured: true,
    publishableKey,
  })
}
