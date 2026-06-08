import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/users/[id]
 * Returns a user's public profile fields (name, avatar_url, role, etc.)
 * Only accessible by authenticated users who share a match or interest request.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the requester shares a match or interest request with the target user
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('id')
      .or(
        `and(user_a_id.eq.${user.id},user_b_id.eq.${id}),and(user_b_id.eq.${user.id},user_a_id.eq.${id})`
      )
      .limit(1)
      .maybeSingle()

    const { data: interestReq } = await supabaseAdmin
      .from('interest_requests')
      .select('id')
      .or(
        `and(requester_id.eq.${user.id},poster_id.eq.${id}),and(poster_id.eq.${user.id},requester_id.eq.${id})`
      )
      .limit(1)
      .maybeSingle()

    // Allow own profile fetch too
    const isSelf = user.id === id

    if (!isSelf && !match && !interestReq) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, avatar_url, role, gender, branch, year, verified_status, verification_badge, looking_for_buddy, is_active')
      .eq('id', id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (err: any) {
    console.error('/api/users/[id] error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
