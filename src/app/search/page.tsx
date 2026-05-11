'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { ListingCard } from '@/components/listing-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { SlidersHorizontal, Map as MapIcon, LayoutGrid } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'

const CAMPUS_LAT = Number(process.env.NEXT_PUBLIC_NFSU_CAMPUS_LAT) || 23.2156
const CAMPUS_LNG = Number(process.env.NEXT_PUBLIC_NFSU_CAMPUS_LNG) || 72.6369
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([])
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [viewMode, setViewMode] = useState<'both' | 'list' | 'map'>('both') // responsive view mode

  // Filter states
  const [minRent, setMinRent] = useState(searchParams.get('minRent') || '')
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') || '')
  const [roomType, setRoomType] = useState(searchParams.get('roomType') || 'ALL')
  const [gender, setGender] = useState(searchParams.get('gender') || 'ALL')

  const fetchSaved = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase.from('saved_listings').select('listing_id').eq('user_id', user.id)
    if (data) setSavedListingIds(new Set(data.map(d => d.listing_id)))
  }, [user])

  const fetchListings = useCallback(async (isLoadMore = false) => {
    setLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('listings')
      .select(`
        *,
        listing_images ( url, is_primary ),
        profiles!listings_poster_id_fkey ( name, avatar_url )
      `)
      .eq('is_active', true)
      .eq('is_verified', true)

    if (minRent) query = query.gte('rent', parseInt(minRent))
    if (maxRent) query = query.lte('rent', parseInt(maxRent))
    if (roomType !== 'ALL') query = query.eq('room_type', roomType)
    if (gender !== 'ALL') query = query.eq('gender_allowed', gender)

    const currentPage = isLoadMore ? page + 1 : 0
    query = query.range(currentPage * 12, currentPage * 12 + 11)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('fetchListings error:', error)
    }

    if (data) {
      if (isLoadMore) {
        setListings(prev => [...prev, ...data])
        setPage(currentPage)
      } else {
        setListings(data)
        setPage(0)
      }
      setHasMore(data.length === 12)
    }
    setLoading(false)
  }, [minRent, maxRent, roomType, gender, page])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved])

  useEffect(() => {
    fetchListings(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minRent, maxRent, roomType, gender]) // refetch on filter change


  // Handle responsive view mode toggle on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setViewMode('both')
      } else if (viewMode === 'both') {
        setViewMode('list')
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted-bg">
      
      {/* Map Panel (Desktop 55vw, Mobile full conditionally) */}
      {(viewMode === 'both' || viewMode === 'map') && (
        <div className={`h-full ${viewMode === 'both' ? 'w-[55vw]' : 'w-full'} relative bg-border-light hidden lg:block lg:w-[55vw]`}>
          {!MAPS_API_KEY ? (
            <div className="w-full h-full flex items-center justify-center p-8 text-center text-text-muted">
              Map requires Google Maps API Key
            </div>
          ) : (
            <APIProvider apiKey={MAPS_API_KEY}>
              <Map
                mapId="campusnest-search"
                defaultCenter={{ lat: CAMPUS_LAT, lng: CAMPUS_LNG }}
                defaultZoom={13}
                gestureHandling="greedy"
                disableDefaultUI={true}
              >
                {/* Campus marker */}
                <AdvancedMarker position={{ lat: CAMPUS_LAT, lng: CAMPUS_LNG }}>
                  <Pin background="#1E3A5F" borderColor="#1E3A5F" glyphColor="white" />
                </AdvancedMarker>

                {/* Listing markers — guard against null lat/lng */}
                {listings
                  .filter(l => l.latitude != null && l.longitude != null)
                  .map(l => (
                    <AdvancedMarker
                      key={l.id}
                      position={{ lat: l.latitude, lng: l.longitude }}
                      title={`₹${l.rent}/mo`}
                    >
                      <div className="bg-coral text-white text-xs font-bold px-2 py-1 rounded-full shadow-md whitespace-nowrap">
                        ₹{l.rent}
                      </div>
                    </AdvancedMarker>
                  ))
                }
              </Map>
            </APIProvider>
          )}
        </div>
      )}

      {/* List Panel (Desktop 45vw, Mobile full conditionally) */}
      {(viewMode === 'both' || viewMode === 'list') && (
        <div className={`h-full overflow-y-auto ${viewMode === 'both' ? 'w-[45vw] min-w-[500px]' : 'w-full'} flex flex-col`}>
          
          {/* Mobile view toggle */}
          <div className="lg:hidden p-4 border-b bg-white flex justify-between gap-2">
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              className="flex-1"
              onClick={() => setViewMode('list')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> List
            </Button>
            <Button 
              variant={'outline'} 
              className="flex-1"
              onClick={() => setViewMode('map')}
            >
              <MapIcon className="w-4 h-4 mr-2" /> Map
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-white border-b border-border-light sticky top-0 z-10 shadow-sm flex flex-wrap items-center gap-3">
            <div className="flex items-center text-sm font-semibold text-text-primary mr-2">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-text-muted" /> Filters
            </div>
            
            <Select value={roomType} onValueChange={(v) => setRoomType(v ?? 'ALL')}>
              <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Room Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="SINGLE">Single</SelectItem>
                <SelectItem value="SHARED">Shared</SelectItem>
                <SelectItem value="1BHK">1 BHK</SelectItem>
                <SelectItem value="PG">PG</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gender} onValueChange={(v) => setGender(v ?? 'ALL')}>
              <SelectTrigger className="w-[120px] h-9 text-sm"><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any Gender</SelectItem>
                <SelectItem value="MALE">Boys Only</SelectItem>
                <SelectItem value="FEMALE">Girls Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input 
                placeholder="Min ₹" 
                className="w-[80px] h-9 text-sm" 
                value={minRent} 
                onChange={e => setMinRent(e.target.value)} 
              />
              <span className="text-text-muted">-</span>
              <Input 
                placeholder="Max ₹" 
                className="w-[80px] h-9 text-sm" 
                value={maxRent} 
                onChange={e => setMaxRent(e.target.value)} 
              />
            </div>
          </div>

          {/* Listings Grid */}
          <div className="flex-1 p-4 bg-muted-bg">
            {loading && page === 0 ? (
              <div className="flex justify-center p-8">
                <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
              </div>
            ) : listings.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  icon="search"
                  title="No listings found"
                  description="Try adjusting your filters or broadening your search criteria."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setMinRent(''); setMaxRent(''); setRoomType('ALL'); setGender('ALL');
                  }}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 sm:pb-8">
                  {listings.map(l => (
                    <ListingCard 
                      key={l.id} 
                      listing={l} 
                      currentUserId={user?.id}
                      initialSaved={savedListingIds.has(l.id)} 
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center pb-8">
                    <Button 
                      variant="outline" 
                      onClick={() => fetchListings(true)}
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Load More'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      )}

    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-muted-bg">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
