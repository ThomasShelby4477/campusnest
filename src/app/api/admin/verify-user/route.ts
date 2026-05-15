import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // 1. Verify the caller is an authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Verify the caller has the ADMIN role
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Process the action using the admin client (bypasses RLS)
    const { userId, action, reason } = await req.json()
    
    if (!userId || !['VERIFIED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Fetch user profile for notification
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single()

    const updateData: Record<string, any> = { verified_status: action }

    if (action === 'REJECTED') {
      updateData.rejection_reason = reason || 'Your verification documents could not be accepted.'
    }

    if (action === 'VERIFIED') {
      updateData.rejection_reason = null
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) throw updateError

    // Create notification for the user
    if (action === 'REJECTED') {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'VERIFICATION_REJECTED',
        title: 'Verification Update',
        body: `Your ID verification was not approved. Reason: ${updateData.rejection_reason}`,
        link: '/reverify',
      })
    } else if (action === 'VERIFIED') {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'VERIFICATION_APPROVED',
        title: 'Verification Approved',
        body: 'Your student ID has been verified. You now have full access to CampusNest!',
        link: '/search',
      })
    }

    // Try sending push notification via Edge Function
    if (targetProfile) {
      try {
        const { data: profileWithToken } = await supabaseAdmin
          .from('profiles')
          .select('fcm_token')
          .eq('id', userId)
          .single()

        if (profileWithToken?.fcm_token) {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              fcm_token: profileWithToken.fcm_token,
              title: action === 'VERIFIED' ? 'Verification Approved' : 'Verification Update',
              body: action === 'VERIFIED'
                ? 'Your ID has been verified. Welcome to CampusNest!'
                : 'Your verification needs attention. Check the app for details.',
              data: { link: '/profile' },
            }),
          })
        }
      } catch {
        // Push notification is best-effort — never fail the main operation
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin verification error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
