import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { csrfGuard } from '@/lib/csrf'
import { rateLimitDistributed } from '@/lib/rate-limit-distributed'
import { getClientIp } from '@/lib/rate-limit'

const consentSchema = z.object({
  policy_version: z.string().min(1),
})

export async function POST(request: NextRequest) {
  // [F-5] CSRF guard — prevent cross-site consent recording
  const csrfError = csrfGuard(request)
  if (csrfError) return csrfError

  // [F-13+F-7] Distributed rate limit: 5 consent records per hour per IP
  const ip = getClientIp(request)
  const rl = await rateLimitDistributed(`consent:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 })
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const result = consentSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid policy version' },
        { status: 422 }
      )
    }

    const { error } = await supabase.from('consent_records').insert({
      user_id: user?.id || null,
      policy_version: result.data.policy_version,
      // Note: ip_address from x-forwarded-for is user-controllable; it is stored
      // for informational purposes only and is NOT relied upon for security decisions.
      ip_address: ip,
    })

    if (error) {
      console.error('Consent record error:', error)
      return NextResponse.json(
        { error: 'Failed to record consent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Consent recorded' })
  } catch (err) {
    console.error('consent route error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
