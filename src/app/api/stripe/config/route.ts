import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder'
    const hasMonthlyPrice = !!process.env.STRIPE_PRICE_MONTHLY_ID && process.env.STRIPE_PRICE_MONTHLY_ID.startsWith('price_')
    const hasYearlyPrice = !!process.env.STRIPE_PRICE_YEARLY_ID && process.env.STRIPE_PRICE_YEARLY_ID.startsWith('price_')
    const hasPublicUrl = !!process.env.NEXT_PUBLIC_URL

    const keyPrefix = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'NOT SET'
    const monthlyPrice = process.env.STRIPE_PRICE_MONTHLY_ID || 'NOT SET'
    const yearlyPrice = process.env.STRIPE_PRICE_YEARLY_ID || 'NOT SET'
    const publicUrl = process.env.NEXT_PUBLIC_URL || 'NOT SET'

    const allConfigured = hasSecretKey && hasMonthlyPrice && hasYearlyPrice

    return NextResponse.json({
      configured: allConfigured,
      details: {
        stripeKey: hasSecretKey ? `${keyPrefix} (valid format)` : `INVALID — got: ${keyPrefix}`,
        monthlyPrice: hasMonthlyPrice ? `${monthlyPrice} (valid)` : `INVALID — got: ${monthlyPrice}`,
        yearlyPrice: hasYearlyPrice ? `${yearlyPrice} (valid)` : `INVALID — got: ${yearlyPrice}`,
        publicUrl: publicUrl,
      },
      missing: [
        !hasSecretKey ? 'STRIPE_SECRET_KEY' : null,
        !hasMonthlyPrice ? 'STRIPE_PRICE_MONTHLY_ID' : null,
        !hasYearlyPrice ? 'STRIPE_PRICE_YEARLY_ID' : null,
        !hasPublicUrl ? 'NEXT_PUBLIC_URL (optional)' : null,
      ].filter(Boolean),
    })
  } catch (error) {
    return NextResponse.json({ configured: false, error: String(error) }, { status: 500 })
  }
}
