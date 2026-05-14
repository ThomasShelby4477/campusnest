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
      verified_status,
      distance_from_college,
      has_wifi,
      has_ac,
      food_available,
      gender_allowed,
      images:listing_images(url, is_primary, order)
    `)
    .eq('is_active', true)
    .order('distance_from_college', { ascending: true, nullsFirst: false })
    .limit(8)

  if (error) {
    return NextResponse.json({ listings: [] })
  }

  // Sort images by order within each listing
  const listings = (data || []).map(l => ({
    ...l,
    images: [...(l.images || [])].sort((a: any, b: any) => a.order - b.order),
  }))

  return NextResponse.json({ listings })
}
