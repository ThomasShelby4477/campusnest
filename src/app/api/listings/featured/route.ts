import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Use server client so we have access to the authenticated user's session
  const supabase = await createClient()

  // Resolve the logged-in user's gender and role for filtering
  const { data: { user } } = await supabase.auth.getUser()
  let userGender: string | null = null
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('gender, role')
      .eq('id', user.id)
      .single()
    userGender = profile?.gender ?? null
    userRole = profile?.role ?? null
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
      profiles!listings_poster_id_fkey!inner ( is_active )
    `)
    .eq('is_active', true)
    .eq('profiles.is_active', true)

  // Hard gender filter — same rule as search page:
  // MALE users see MALE + ANY; FEMALE users see FEMALE + ANY; guests see all. ADMINs see all.
  if (userRole !== 'ADMIN') {
    if (userGender === 'MALE') {
      query = query.in('gender_allowed', ['MALE', 'ANY'])
    } else if (userGender === 'FEMALE') {
      query = query.in('gender_allowed', ['FEMALE', 'ANY'])
    }
  }

  const { data, error } = await query
    .order('distance_from_college', { ascending: true, nullsFirst: false })
    .limit(8)

  if (error) {
    console.error('Featured listings error:', error)
    return NextResponse.json({ listings: [] })
  }

  // Sort images by order within each listing
  const listings = (data || []).map((l: any) => ({
    ...l,
    images: [...(l.listing_images || [])].sort((a: any, b: any) => a.order - b.order),
    verified_status: 'VERIFIED',
  }))

  return NextResponse.json({ listings })
}
