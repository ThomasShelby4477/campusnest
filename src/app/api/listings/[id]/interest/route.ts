import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

    // Get requester's name
    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

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
