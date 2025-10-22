import { z } from 'zod'

/**
 * Environment Variable Schema
 * Validates all required environment variables at build time
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // OpenAI (Required for AI features)
  OPENAI_API_KEY: z.string().min(1),

  // Plaid (Optional - for bank feeds)
  PLAID_CLIENT_ID: z.string().optional(),
  PLAID_SECRET: z.string().optional(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).optional(),

  // Wise (Optional - for multi-currency)
  WISE_API_KEY: z.string().optional(),
  WISE_PROFILE_ID: z.string().optional(),

  // Stripe (Optional - for payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // PayPal (Optional - for payments)
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_MODE: z.enum(['sandbox', 'live']).optional(),

  // Email Service (Optional)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  // Encryption (Required in production)
  ENCRYPTION_KEY: z.string().length(32).optional(),

  // Exchange Rates (Optional)
  FX_RATES_API_KEY: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
})

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export const env = envSchema.parse(process.env)

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>

/**
 * Check if a feature is enabled based on environment variables
 */
export const features = {
  hasOpenAI: !!env.OPENAI_API_KEY,
  hasPlaid: !!(env.PLAID_CLIENT_ID && env.PLAID_SECRET),
  hasWise: !!(env.WISE_API_KEY && env.WISE_PROFILE_ID),
  hasStripe: !!(env.STRIPE_SECRET_KEY && env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  hasPayPal: !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
  hasEmail: !!env.SENDGRID_API_KEY,
  hasEncryption: !!env.ENCRYPTION_KEY,
  hasFxRates: !!env.FX_RATES_API_KEY,
} as const
