import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Use server client so we have access to the authenticated user's session
  const supabase = await createClient()

  // Resolve the logged-in user's gender for filtering
  const { data: { user } } = await supabase.auth.getUser()
  let userGender: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', user.id)
      .single()
    userGender = profile?.gender ?? null
  }

  let query = supabase
    .from('listings')
    .select(`
      id,
      title,
      address,
      rent,
      room_type,
      is_verified,
      distance_from_college,
      has_wifi,
      has_ac,
      food_available,
      gender_allowed,
      listing_images ( url, is_primary, "order" ),
      poster:profiles!listings_poster_id_fkey ( is_active )
    `)
    .eq('is_active', true)
    .eq('profiles.is_active', true)  // exclude suspended poster listings

  // Hard gender filter — same rule as search page:
  // MALE users see MALE + ANY; FEMALE users see FEMALE + ANY; guests see all
  if (userGender === 'MALE') {
    query = query.in('gender_allowed', ['MALE', 'ANY'])
  } else if (userGender === 'FEMALE') {
    query = query.in('gender_allowed', ['FEMALE', 'ANY'])
  }

  const { data, error } = await query
    .order('distance_from_college', { ascending: true, nullsFirst: false })
    .limit(8)

  if (error) {
    console.error('Featured listings error:', error)
    return NextResponse.json({ listings: [] })
  }

  // Filter out listings from suspended posters (double-check since FK filter may not work on all Supabase plans)
  // and sort images by order within each listing
  const listings = (data || [])
    .filter((l: any) => {
      const poster = Array.isArray(l.poster) ? l.poster[0] : l.poster
      return poster?.is_active !== false
    })
    .map((l: any) => ({
      ...l,
      images: [...(l.listing_images || [])].sort((a: any, b: any) => a.order - b.order),
      verified_status: 'VERIFIED',
    }))

  return NextResponse.json({ listings })
}
