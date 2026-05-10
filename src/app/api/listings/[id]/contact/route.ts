import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('verified_status')
      .eq('id', user.id)
      .single()

    if (profile?.verified_status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Only verified users can view contact details' },
        { status: 403 }
      )
    }

    // Get the listing owner's ID
    const { data: listing } = await supabase
      .from('listings')
      .select('poster_id')
      .eq('id', id)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Get poster's phone
    const { data: posterProfile } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('id', listing.poster_id)
      .single()

    if (!posterProfile?.phone) {
      return NextResponse.json(
        { error: 'Poster has no phone number available' },
        { status: 404 }
      )
    }

    // Log the action to audit_logs
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      action: 'VIEW_CONTACT',
      target_type: 'LISTING',
      target_id: id,
      metadata: { poster_id: listing.poster_id },
    })

    return NextResponse.json({ phone: posterProfile.phone })
  } catch (err) {
    console.error('Contact view error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
