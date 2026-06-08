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

    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot suspend yourself' }, { status: 400 })
    }

    // 1. Mark profile as inactive
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (profileError) {
      console.error('Suspend profile error:', profileError)
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
    }

    // 2. Ban at Supabase Auth level — prevents new OTP requests & logins
    //    Run twice if first attempt fails (handles ban_duration state edge cases)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
        break
      } catch (banErr) {
        if (attempt === 1) console.warn('Auth-level ban failed after retry:', banErr)
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // 3. Invalidate ALL existing sessions immediately
    try {
      await supabaseAdmin.auth.admin.signOut(userId, 'global')
    } catch (signOutErr) {
      console.warn('Session sign-out failed (non-fatal):', signOutErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/admin/suspend-user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
