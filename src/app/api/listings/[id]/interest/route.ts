import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/listings/[id]/interest
 * Send an interest request for a listing. Creates a notification for the poster.
 *
 * GET /api/listings/[id]/interest
 * Check if the current user has already sent an interest request.
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // [SECURITY M-4] Rate limit: 20 interest requests per hour per user
    const rl = rateLimit(`interest:send:${user.id}`, { limit: 20, windowMs: 60 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests. Please wait before sending more.' }, { status: 429 })
    }

    // Get optional message from body
    let message = ''
    try {
      const body = await request.json()
      message = body.message?.slice(0, 500) || ''
    } catch {
      // No body is fine
    }

    // Fetch listing to get poster info
    const { data: listing, error: listingErr } = await supabaseAdmin
      .from('listings')
      .select('id, poster_id, title')
      .eq('id', listingId)
      .eq('is_active', true)
      .single()

    if (listingErr || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Can't show interest on your own listing
    if (listing.poster_id === user.id) {
      return NextResponse.json({ error: 'Cannot show interest on your own listing' }, { status: 400 })
    }

    // Check for existing request
    const { data: existing } = await supabaseAdmin
      .from('interest_requests')
      .select('id, status')
      .eq('listing_id', listingId)
      .eq('requester_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({
        error: 'already_sent',
        status: existing.status,
        message: existing.status === 'PENDING'
          ? 'Interest request already sent'
          : existing.status === 'ACCEPTED'
          ? 'Your interest has been accepted'
          : 'Your interest was declined'
      }, { status: 409 })
    }

    // Get requester's profile
    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, verified_status, role, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (requesterProfile?.verified_status !== 'VERIFIED') {
      return NextResponse.json({ error: 'Only verified students can contact posters' }, { status: 403 })
    }

    // [SUBSCRIPTION] Pro subscription gate — admins exempt
    if (requesterProfile.role !== 'ADMIN') {
      const isPro =
        requesterProfile.subscription_status === 'PRO' &&
        requesterProfile.subscription_expires_at &&
        new Date(requesterProfile.subscription_expires_at) > new Date()
      if (!isPro) {
        return NextResponse.json(
          { error: 'PRO_REQUIRED', message: 'Upgrade to CampusNest Pro to show interest' },
          { status: 403 }
        )
      }
    }

    // Create the interest request
    const { error: insertErr } = await supabaseAdmin
      .from('interest_requests')
      .insert({
        listing_id: listingId,
        requester_id: user.id,
        poster_id: listing.poster_id,
        message,
      })

    if (insertErr) {
      console.error('interest insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to send interest' }, { status: 500 })
    }

    // Create notification for the poster
    await supabaseAdmin.from('notifications').insert({
      user_id: listing.poster_id,
      type: 'INTEREST_REQUEST',
      title: 'New Interest on Your Listing',
      body: `${requesterProfile?.name || 'Someone'} is interested in "${listing.title}"`,
      link: '/interest-requests',
    })

    return NextResponse.json({ message: 'Interest sent successfully' })
  } catch (err) {
    console.error('interest route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ status: null })
    }

    const { data } = await supabase
      .from('interest_requests')
      .select('id, status')
      .eq('listing_id', listingId)
      .eq('requester_id', user.id)
      .single()

    return NextResponse.json({ status: data?.status || null, id: data?.id || null })
  } catch {
    return NextResponse.json({ status: null })
  }
}
