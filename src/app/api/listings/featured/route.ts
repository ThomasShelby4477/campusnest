import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
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
      listing_images ( url, is_primary, "order" )
    `)
    .eq('is_active', true)
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
    verified_status: l.is_verified ? 'VERIFIED' : 'PENDING',
  }))

  return NextResponse.json({ listings })
}
