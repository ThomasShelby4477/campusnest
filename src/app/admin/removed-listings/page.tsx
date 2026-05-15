import { supabaseAdmin } from '@/lib/supabase/admin'
import { RemovedListingsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function RemovedListingsPage() {
  const { data: listings } = await supabaseAdmin
    .from('listings')
    .select(`
      *,
      listing_images(url, is_primary),
      profiles!listings_poster_id_fkey(name, email, verified_status, avatar_url)
    `)
    .eq('is_active', false)
    .order('removed_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Removed Listings</h1>
      <RemovedListingsClient initialListings={listings || []} />
    </div>
  )
}
