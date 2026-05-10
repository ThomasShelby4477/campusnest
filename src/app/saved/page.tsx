import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingCard } from '@/components/listing-card'
import { Bookmark } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'

export default async function SavedListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/saved')
  }

  // Fetch saved listings
  const { data: savedListings } = await supabase
    .from('saved_listings')
    .select(`
      listing_id,
      listings (
        *,
        listing_images ( url, is_primary ),
        profiles ( name, avatar_url )
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const validListings = savedListings?.map(s => s.listings).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-muted-bg py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-20 sm:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-coral" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Saved Listings</h1>
            <p className="text-text-muted mt-1">Properties you&apos;ve favorited ({validListings.length})</p>
          </div>
        </div>

        {validListings.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="saved"
              title="No saved listings yet"
              description="Keep track of your favorite properties by clicking the heart icon on any listing."
              actionLabel="Explore Properties"
              actionHref="/search"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {validListings.map((listing: any) => (
              <div key={listing.id} className="relative">
                <ListingCard 
                  listing={listing} 
                  currentUserId={user.id} 
                  initialSaved={true} 
                />
                {!listing.is_active && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center z-10">
                    <div className="bg-black text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                      No longer available
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
