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

    const { listingId, reason } = await req.json()
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 })
    }

    // Fetch listing info for notification
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('title, poster_id, profiles!listings_poster_id_fkey(name)')
      .eq('id', listingId)
      .single()

    if (fetchError || !listing) {
      console.error('remove-listing fetch error:', fetchError)
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const posterId = (listing as any).poster_id
    const listingTitle = listing.title
    const reasonText = reason?.trim() || 'This listing has been removed by an administrator.'
    const posterName = (listing as any).profiles?.name || 'User'

    // Soft-delete the listing with removal metadata
    const { error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        is_active: false,
        removal_reason: reasonText,
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      })
      .eq('id', listingId)

    if (updateError) throw updateError

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'REMOVE_LISTING',
      target_type: 'listing',
      target_id: listingId,
      metadata: { poster_id: posterId, poster_name: posterName, listing_title: listingTitle, reason: reasonText },
    })

    // Notify the poster
    if (posterId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: posterId,
        type: 'LISTING_REMOVED',
        title: 'Listing Removed',
        body: `Your listing "${listingTitle}" was removed. Reason: ${reasonText}`,
        link: '/my-listings',
      })

      // Attempt push notification
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
              title: 'Listing Removed',
              body: `Your listing "${listingTitle}" was removed by admin.`,
              data: { link: '/my-listings' },
            }),
          })
        }
      } catch {
        // Push is best-effort
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin remove-listing error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
