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

    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('title, poster_id, profiles!listings_poster_id_fkey(name)')
      .eq('id', listingId)
      .single()

    if (fetchError || !listing) {
      console.error('restore-listing fetch error:', fetchError)
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const posterId = (listing as any).poster_id
    const listingTitle = listing.title
    const embedded = (listing as any)['profiles!listings_poster_id_fkey'] || (listing as any).profiles || {}
    const posterName = embedded.name || 'User'

    // Reactivate the listing (always works)
    const { error: activateError } = await supabaseAdmin
      .from('listings')
      .update({ is_active: true })
      .eq('id', listingId)

    if (activateError) throw activateError

    // Clear removal metadata (best-effort — columns may not exist until migration 019 is applied)
    try {
      await supabaseAdmin.from('listings')
        .update({
          removal_reason: null,
          removed_at: null,
          removed_by: null,
        })
        .eq('id', listingId)
    } catch { /* columns may not exist yet */ }

    if (posterId) {
      await supabaseAdmin.from('notifications').insert({
        user_id: posterId,
        type: 'LISTING_RESTORED',
        title: 'Listing Restored',
        body: `Your listing "${listingTitle}" has been restored and is now visible to other users.`,
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

    // Audit log (best-effort)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: user.id,
        action: 'RESTORE_LISTING',
        target_type: 'listing',
        target_id: listingId,
        metadata: { poster_id: posterId, poster_name: posterName, listing_title: listingTitle },
      })
    } catch { /* audit_logs may not be ready */ }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Admin restore-listing error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
