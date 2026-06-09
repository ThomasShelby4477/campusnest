import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  userId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const result = bodySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
    }

    const { userId } = result.data

    // 1. Re-activate profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: true })
      .eq('id', userId)

    if (profileError) {
      console.error('Unsuspend profile error:', profileError)
      return NextResponse.json({ error: 'Failed to unsuspend user' }, { status: 500 })
    }

    // 1b. Re-activate all listings that belonged to this user
    const { error: listingsError } = await supabaseAdmin
      .from('listings')
      .update({ is_active: true })
      .eq('poster_id', userId)
    if (listingsError) {
      console.warn('Failed to re-activate user listings after unsuspend (non-fatal):', listingsError)
    }

    // 2. Lift the Supabase Auth ban (retry once on failure)
    let banLifted = false
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
        banLifted = true
        break
      } catch (err) {
        if (attempt === 1) console.warn('Auth-level unban failed after retry:', err)
        await new Promise(r => setTimeout(r, 200))
      }
    }

    if (!banLifted) {
      console.error('Could not lift auth ban for user:', userId)
      // Still return success since is_active=true allows login via verify-otp fallback
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/admin/unsuspend-user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
