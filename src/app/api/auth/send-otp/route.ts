import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimitDistributed, DistributedRateLimitResult } from '@/lib/rate-limit-distributed'
import { getClientIp } from '@/lib/rate-limit'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'nfsu.ac.in'

const schema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .refine((e) => e.endsWith(`@${ALLOWED_DOMAIN}`), {
      message: `Only @${ALLOWED_DOMAIN} email addresses are allowed`,
    }),
  context: z.enum(['signup', 'login']).default('login'),
})

export async function POST(request: NextRequest) {
  // [F-7] Distributed rate limit: 5 OTP requests per 15 minutes per IP
  // Uses Supabase-backed counter shared across all serverless instances.
  const ip = getClientIp(request)
  const rlIp: DistributedRateLimitResult = await rateLimitDistributed(`otp:ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 })
  if (!rlIp.success) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please wait before trying again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rlIp.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message)
      return NextResponse.json({ error: errors[0] }, { status: 422 })
    }

    const { email, context } = result.data

    // [F-7+F-22] Per-email distributed rate limit — blocks inbox flooding
    // from many source IPs. Shared across all serverless instances.
    const rlEmail: DistributedRateLimitResult = await rateLimitDistributed(
      `otp:email:${email.toLowerCase()}`,
      { limit: 20, windowMs: 15 * 60 * 1000 }
    )
    if (!rlEmail.success) {
      return NextResponse.json(
        { error: 'Too many OTP requests for this address. Please wait before trying again.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((rlEmail.resetAt - Date.now()) / 1000)) },
        }
      )
    }

    // For signup: check if user already exists → tell them to log in instead
    if (context === 'signup') {
      const { data: exists } = await supabaseAdmin.rpc('user_exists_by_email', { user_email: email })
      if (exists) {
        return NextResponse.json(
          { error: 'user_exists', message: 'An account with this email already exists.' },
          { status: 409 }
        )
      }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: context === 'signup',
      },
    })

    if (error) {
      console.error('OTP send error:', error)
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (err) {
    console.error('send-otp route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
