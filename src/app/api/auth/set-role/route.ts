import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { csrfGuard } from '@/lib/csrf'

const schema = z.object({
  role: z.enum(['STUDENT', 'LANDLORD']),
})

/**
 * POST /api/auth/set-role
 * Sets the user's role during signup. Only allowed once — if role is already
 * set to a non-default value we reject the request to prevent escalation.
 */
export async function POST(request: NextRequest) {
  // [SECURITY H-5] Reject cross-origin mutation requests
  const csrfError = csrfGuard(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0]?.message ?? 'Invalid role' }, { status: 422 })
    }

    const { role } = result.data

    // Fetch current profile to check existing role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, verified_status')
      .eq('id', user.id)
      .single()

    // Only allow updating role if the profile is still in early signup state
    // (PARTIAL verified_status means they haven't completed verification yet)
    // This prevents an already-verified STUDENT from switching to LANDLORD
    if (profile && profile.verified_status !== 'PARTIAL') {
      return NextResponse.json(
        { error: 'Role cannot be changed after verification is complete' },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', user.id)

    if (updateError) {
      console.error('set-role update error:', updateError)
      return NextResponse.json({ error: 'Failed to set role' }, { status: 500 })
    }

    // Return fresh profile
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ profile: updatedProfile })
  } catch (err) {
    console.error('set-role error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
