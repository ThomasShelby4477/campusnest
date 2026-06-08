import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const targetType = searchParams.get('type')
    const targetId = searchParams.get('id')

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 })
    }

    if (targetType === 'LISTING') {
      const { data: listing } = await supabaseAdmin
        .from('listings')
        .select(`
          *,
          listing_images ( url, is_primary, "order" ),
          profiles!listings_poster_id_fkey ( id, name, email, avatar_url, role, verified_status, verification_badge, is_active, created_at, student_id_path )
        `)
        .eq('id', targetId)
        .single()

      if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

      // Fetch other listings by same poster
      const posterId = (listing as any).profiles?.id || (listing as any)['profiles!listings_poster_id_fkey']?.id
      const { data: otherListings } = posterId ? await supabaseAdmin
        .from('listings')
        .select('id, title, rent, is_active, room_type, created_at')
        .eq('poster_id', posterId)
        .neq('id', targetId)
        .order('created_at', { ascending: false })
        .limit(5)
        : { data: [] }

      return NextResponse.json({ listing, otherListings: otherListings || [] })
    }

    if (targetType === 'USER') {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()

      if (!userProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      // Fetch their listings
      const { data: userListings } = await supabaseAdmin
        .from('listings')
        .select('id, title, rent, is_active, room_type, created_at, listing_images(url, is_primary)')
        .eq('poster_id', targetId)
        .order('created_at', { ascending: false })
        .limit(10)

      return NextResponse.json({ userProfile, userListings: userListings || [] })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('GET /api/admin/report-details error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
