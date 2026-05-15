import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { listingId } = await req.json()
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('title, poster_id, profiles(name)')
      .eq('id', listingId)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        is_active: true,
        removal_reason: null,
        removed_at: null,
        removed_by: null,
      })
      .eq('id', listingId)

    if (updateError) throw updateError

    const posterId = (listing as any).poster_id
    const listingTitle = listing.title
    const posterName = (listing as any).profiles?.name || 'User'

    if (posterId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: posterId,
        type: 'LISTING_RESTORED',
        title: 'Listing Restored',
        body: `Your listing "${listingTitle}" has been restored and is now visible to other users.`,
        link: '/my-listings',
      })

      try {
        const { data: profileWithToken } = await supabaseAdmin
          .from('profiles')
          .select('fcm_token')
          .eq('id', posterId)
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
              title: 'Listing Restored',
              body: `Your listing "${listingTitle}" has been restored by admin.`,
              data: { link: '/my-listings' },
            }),
          })
        }
      } catch {
        // Push is best-effort
      }
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'RESTORE_LISTING',
      target_type: 'listing',
      target_id: listingId,
      metadata: { poster_id: posterId, poster_name: posterName, listing_title: listingTitle },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin restore-listing error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
