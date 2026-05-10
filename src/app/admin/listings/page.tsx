import { supabaseAdmin } from '@/lib/supabase/admin'
import { ListingsClient } from './client'

export const dynamic = 'force-dynamic'

export default async function ListingsAdminPage() {
  const { data: listings } = await supabaseAdmin
    .from('listings')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-3xl font-black text-navy mb-8">Listings Moderation</h1>
      <ListingsClient initialListings={listings || []} />
    </div>
  )
}
