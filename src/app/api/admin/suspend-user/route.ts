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

    // 1. Mark profile as inactive in our own table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (profileError) {
      console.error('Suspend profile error:', profileError)
      return NextResponse.json({ error: 'Failed to suspend user' }, { status: 500 })
    }

    // 2. Sign out all active Supabase Auth sessions for this user
    //    This ensures they get kicked out immediately if already logged in.
    try {
      await supabaseAdmin.auth.admin.signOut(userId, 'global')
    } catch (signOutErr) {
      // Non-fatal — is_active check in SuspensionGuard will still catch them on next load
      console.warn('Could not sign out sessions for suspended user:', signOutErr)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/admin/suspend-user error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
