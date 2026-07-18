import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  typescript: true,
})

// Price IDs — you'll set these after creating products in Stripe Dashboard
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY_ID || '',
  yearly: process.env.STRIPE_PRICE_YEARLY_ID || '',
} as const

export type BillingPeriod = 'monthly' | 'yearly'
