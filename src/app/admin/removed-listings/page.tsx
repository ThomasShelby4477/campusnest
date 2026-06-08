import { supabaseAdmin } from '@/lib/supabase/admin'
import { RemovedListingsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function RemovedListingsPage() {
  const { data: listings, error } = await supabaseAdmin
    .from('listings')
    .select(`
      *,
      listing_images(url, is_primary),
      profiles!listings_poster_id_fkey(name, email, verified_status, avatar_url)
    `)
    .eq('is_active', false)
    .order('updated_at', { ascending: false })

  if (error) console.error('removed-listings fetch error:', error)

  return (
    <div className="space-y-5">
      <h1 className="text-xl md:text-2xl font-black text-navy">Removed Listings</h1>
      <RemovedListingsClient initialListings={listings || []} />
    </div>
  )
}
