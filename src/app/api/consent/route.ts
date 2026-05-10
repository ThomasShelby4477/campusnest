import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'

const consentSchema = z.object({
  policy_version: z.string().min(1),
})

export async function POST(request: NextRequest) {
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

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const { error } = await supabase.from('consent_records').insert({
      user_id: user?.id || null,
      policy_version: result.data.policy_version,
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
