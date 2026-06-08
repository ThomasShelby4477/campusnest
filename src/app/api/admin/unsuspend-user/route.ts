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

    // 2. Lift the Supabase Auth ban
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none',
      })
    } catch (err) {
      console.warn('Auth-level unban failed (non-fatal):', err)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/admin/unsuspend-user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
