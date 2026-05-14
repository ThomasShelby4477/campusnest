'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps'
import { SlidersHorizontal, Map as MapIcon, LayoutGrid } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { ListingCard } from '@/components/listing-card'
import { ListingDetailPanel } from '@/components/listing-detail-panel'

const CAMPUS_LAT = Number(process.env.NEXT_PUBLIC_NFSU_CAMPUS_LAT) || 28.696385
const CAMPUS_LNG = Number(process.env.NEXT_PUBLIC_NFSU_CAMPUS_LNG) || 77.109666
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

function SearchContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const [listings, setListings] = useState<any[]>([])
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  // null = no selection; object = selected listing
  const [selectedListing, setSelectedListing] = useState<any | null>(null)

  // Filters
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
      .select(`*, listing_images ( url, is_primary ), profiles!listings_poster_id_fkey ( name, avatar_url )`)
      .eq('is_active', true)
      .eq('is_verified', true)

    if (minRent) query = query.gte('rent', parseInt(minRent))
    if (maxRent) query = query.lte('rent', parseInt(maxRent))
    if (roomType !== 'ALL') query = query.eq('room_type', roomType)
    if (gender !== 'ALL') query = query.eq('gender_allowed', gender)

    const currentPage = isLoadMore ? page + 1 : 0
    query = query.range(currentPage * 12, currentPage * 12 + 11).order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) console.error('fetchListings error:', error)
    if (data) {
      if (isLoadMore) { setListings(prev => [...prev, ...data]); setPage(currentPage) }
      else { setListings(data); setPage(0) }
      setHasMore(data.length === 12)
    }
    setLoading(false)
  }, [minRent, maxRent, roomType, gender, page])

  useEffect(() => { fetchSaved() }, [fetchSaved])
  useEffect(() => { fetchListings(false) }, [minRent, maxRent, roomType, gender]) // eslint-disable-line

  // Handle ?listingId=... to auto-open a listing from external links
  useEffect(() => {
    const lid = searchParams.get('listingId')
    if (lid && !selectedListing) {
      const fetchSingle = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('listings')
          .select(`*, listing_images ( url, is_primary ), profiles!listings_poster_id_fkey ( name, avatar_url )`)
          .eq('id', lid)
          .single()
        if (data) setSelectedListing(data)
      }
      fetchSingle()
    }
  }, [searchParams]) // eslint-disable-line

  // Reset to list on desktop
  useEffect(() => {
    const handle = () => { if (window.innerWidth >= 1024) setViewMode('list') }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  const handleSelectListing = (listing: any) => {
    setSelectedListing((prev: any) => prev?.id === listing.id ? null : listing)
  }

  const FiltersBar = (
    <div className="p-3 bg-white border-b border-border-light sticky top-0 z-10 shadow-sm flex flex-wrap items-center gap-2">
      <div className="flex items-center text-sm font-semibold text-text-primary mr-1">
        <SlidersHorizontal className="w-4 h-4 mr-1.5 text-text-muted" /> Filters
      </div>
      <Select value={roomType} onValueChange={v => setRoomType(v ?? 'ALL')}>
        <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue placeholder="Room Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Types</SelectItem>
          <SelectItem value="SINGLE">Single</SelectItem>
          <SelectItem value="SHARED">Shared</SelectItem>
          <SelectItem value="1BHK">1 BHK</SelectItem>
          <SelectItem value="PG">PG</SelectItem>
        </SelectContent>
      </Select>
      <Select value={gender} onValueChange={v => setGender(v ?? 'ALL')}>
        <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Any Gender</SelectItem>
          <SelectItem value="MALE">Boys Only</SelectItem>
          <SelectItem value="FEMALE">Girls Only</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5">
        <Input placeholder="Min ₹" className="w-[72px] h-8 text-xs" value={minRent} onChange={e => setMinRent(e.target.value)} />
        <span className="text-text-muted text-xs">–</span>
        <Input placeholder="Max ₹" className="w-[72px] h-8 text-xs" value={maxRent} onChange={e => setMaxRent(e.target.value)} />
      </div>
    </div>
  )

  const MapPanel = (
    <div className="w-full h-full relative">
      {!MAPS_API_KEY ? (
        <div className="w-full h-full flex items-center justify-center text-text-muted text-sm p-8 text-center">
          Map requires Google Maps API Key
        </div>
      ) : (
        <APIProvider apiKey={MAPS_API_KEY}>
          <Map
            mapId="campusnest-search"
            defaultCenter={{ lat: CAMPUS_LAT, lng: CAMPUS_LNG }}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
          >
            {/* Campus */}
            <AdvancedMarker position={{ lat: CAMPUS_LAT, lng: CAMPUS_LNG }}>
              <Pin background="#1E3A5F" borderColor="#1E3A5F" glyphColor="white" />
            </AdvancedMarker>

            {/* Listings */}
            {listings
              .filter(l => l.latitude != null && l.longitude != null)
              .map(l => (
                <AdvancedMarker
                  key={l.id}
                  position={{ lat: l.latitude, lng: l.longitude }}
                  onClick={() => handleSelectListing(l)}
                >
                  <div className={`px-2 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap cursor-pointer transition-all ${
                    selectedListing?.id === l.id
                      ? 'bg-navy text-white scale-110'
                      : 'bg-coral text-white hover:scale-105'
                  }`}>
                    ₹{l.rent}
                  </div>
                </AdvancedMarker>
              ))
            }
          </Map>
        </APIProvider>
      )}
    </div>
  )

  const ListPanel = (
    <div className="flex-1 overflow-y-auto">
      {loading && page === 0 ? (
        <div className="flex justify-center p-12">
          <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="py-8">
          <EmptyState
            icon="search" title="No listings found"
            description="Try adjusting your filters."
            actionLabel="Clear Filters"
            onAction={() => { setMinRent(''); setMaxRent(''); setRoomType('ALL'); setGender('ALL') }}
          />
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-2.5 pb-24">
          {listings.map(l => (
            <div
              key={l.id}
              className={`rounded-xl transition-all ${selectedListing?.id === l.id ? 'ring-2 ring-coral' : ''}`}
            >
              <ListingCard
                listing={l}
                currentUserId={user?.id}
                initialSaved={savedListingIds.has(l.id)}
                onSelect={() => handleSelectListing(l)}
              />
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => fetchListings(true)} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted-bg">

      {/* ── DESKTOP layout ───────────────────────────────── */}
      <div className="hidden lg:flex w-full h-full">
        {/* Map — always visible on desktop */}
        <div className="flex-1 h-full">{MapPanel}</div>

        {/* List panel */}
        <div className={`h-full flex flex-col bg-white border-l border-border-light transition-all duration-300 ${selectedListing ? 'w-[400px]' : 'w-[420px]'}`}>
          {FiltersBar}
          {ListPanel}
        </div>

        {/* Detail panel slides in from right on desktop */}
        <div className={`h-full border-l border-border-light overflow-hidden transition-all duration-300 bg-white ${selectedListing ? 'w-[380px]' : 'w-0'}`}>
          {selectedListing && (
            <ListingDetailPanel
              listing={selectedListing}
              currentUserId={user?.id}
              initialSaved={savedListingIds.has(selectedListing.id)}
              onClose={() => setSelectedListing(null)}
            />
          )}
        </div>
      </div>

      {/* ── MOBILE layout ────────────────────────────────── */}
      <div className="flex lg:hidden flex-col w-full h-full">
        {/* Toggle bar */}
        <div className="bg-white border-b border-border-light flex shrink-0">
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              viewMode === 'list' ? 'border-coral text-coral' : 'border-transparent text-text-muted'
            }`}
            onClick={() => setViewMode('list')}
          >
            <LayoutGrid className="w-4 h-4" /> List
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
              viewMode === 'map' ? 'border-coral text-coral' : 'border-transparent text-text-muted'
            }`}
            onClick={() => setViewMode('map')}
          >
            <MapIcon className="w-4 h-4" /> Map
          </button>
        </div>

        {viewMode === 'map' ? (
          /* Full-screen map on mobile */
          <div className="flex-1 relative">
            {MapPanel}
            {/* Bottom sheet for selected listing on mobile */}
            {selectedListing && (
              <div className="absolute bottom-0 left-0 right-0 z-20 max-h-[70vh] overflow-y-auto bg-white rounded-t-2xl shadow-2xl">
                <ListingDetailPanel
                  listing={selectedListing}
                  currentUserId={user?.id}
                  initialSaved={savedListingIds.has(selectedListing.id)}
                  onClose={() => setSelectedListing(null)}
                />
              </div>
            )}
          </div>
        ) : (
          /* List view on mobile */
          <div className="flex flex-col flex-1 overflow-hidden">
            {FiltersBar}
            {ListPanel}
          </div>
        )}
      </div>

      {/* Mobile full-screen detail when tapping list card */}
      {selectedListing && viewMode === 'list' && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <ListingDetailPanel
            listing={selectedListing}
            currentUserId={user?.id}
            initialSaved={savedListingIds.has(selectedListing.id)}
            onClose={() => setSelectedListing(null)}
          />
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
