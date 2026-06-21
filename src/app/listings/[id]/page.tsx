import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { rateLimitDistributed } from '@/lib/rate-limit-distributed'
import Image from 'next/image'
import {
  MapPin, Home, Users, CheckCircle, Wifi, Thermometer, Utensils,
  Droplets, ShieldCheck, UserCircle2, Wind, UserCheck, Building2, Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ListingContactButton } from './contact-button'
import { BackButton } from './back-button'
import { ListingHero } from './listing-hero'
import { ReportListingButton } from '@/components/report-listing-button'

export const dynamic = 'force-dynamic'

// ── Display helpers ──────────────────────────────────────────
const FLAT_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Single Room',
  '1BHK': '1 BHK',
  '2BHK': '2 BHK',
  '3BHK': '3 BHK',
  PG: 'PG / Hostel',
  SHARED: 'Shared Room', // legacy
}

const FURNISHED_LABELS: Record<string, string> = {
  FURNISHED: 'Fully Furnished',
  SEMI: 'Semi Furnished',
  UNFURNISHED: 'Unfurnished',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Boys Only',
  FEMALE: 'Girls Only',
  ANY: 'Co-ed',
}

const WATER_LABELS: Record<string, string> = {
  '24H': '24h Water',
  TIMED: 'Timed Supply',
  BOREWELL: 'Borewell',
}

const OWNER_PROXIMITY_LABELS: Record<string, string> = {
  SAME_BUILDING: 'Owner in Same Building',
  NEARBY: 'Owner Nearby',
  FAR: 'Owner Far Away',
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch listing data
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images ( url, is_primary, "order" ),
      profiles!listings_poster_id_fkey ( name, avatar_url, verified_status, verification_badge, role, is_active )
    `)
    .eq('id', id)
    .single()

  if (!listing || !listing.is_active) {
    notFound()
  }

  // Also block if poster's account is suspended
  const posterCheck = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
  if (posterCheck && posterCheck.is_active === false) {
    notFound()
  }

  // Check auth for contact button visibility + gender guard
  const { data: { user } } = await supabase.auth.getUser()
  let isVerifiedUser = false
  let userGender: string | null = null
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('verified_status, gender, role').eq('id', user.id).single()
    isVerifiedUser = profile?.verified_status === 'VERIFIED'
    userGender = profile?.gender ?? null
    userRole = profile?.role ?? null
  }

  // ── Hard gender access check ──────────────────────────────
  // Authenticated users can only view listings that match their gender or are ANY.
  // Admins are exempt — they must be able to view and moderate all listings.
  const genderAllowed = listing.gender_allowed // 'MALE' | 'FEMALE' | 'ANY'
  const genderBlocked =
    user !== null &&
    userGender !== null &&
    userRole !== 'ADMIN' &&        // ← admins bypass gender gate
    genderAllowed !== 'ANY' &&
    genderAllowed !== userGender

  if (genderBlocked) {
    const genderLabel = genderAllowed === 'MALE' ? 'boys only' : 'girls only'
    const userLabel = userGender === 'MALE' ? 'male' : 'female'
    return (
      <div className="min-h-screen bg-muted-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl border border-border-light shadow-lg p-10">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-danger" />
          </div>
          <h1 className="text-2xl font-black text-navy mb-2">Access Restricted</h1>
          <p className="text-text-muted leading-relaxed mb-6">
            This listing is marked as <strong className="text-navy">{genderLabel}</strong>.
            As a <strong className="text-navy">{userLabel}</strong> user, you can only view listings
            that match your gender or are open to all.
          </p>
          <a
            href="/search"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-navy text-white rounded-xl font-bold text-sm hover:bg-navy/90 transition-colors"
          >
            Browse Matching Listings
          </a>
        </div>
      </div>
    )
  }

  // [F-14] Rate-limited view increment — 1 view per IP per listing per 5 minutes.
  // Prevents a single user from inflating view counts by refreshing.
  // Uses distributed counter shared across all serverless instances.
  try {
    const requestHeaders = await headers()
    const ip =
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      requestHeaders.get('x-real-ip') ||
      'unknown'
    const rl = await rateLimitDistributed(`views:${ip}:${id}`, { limit: 1, windowMs: 5 * 60 * 1000 })
    if (rl.success) {
      await supabase.rpc('increment_views', { listing_id: id })
    }
  } catch {
    // View counting is non-critical — never fail the page load
  }

  const images = [...(listing.listing_images || [])].sort((a, b) => a.order - b.order)
  if (images.length === 0) images.push({ url: '/placeholder-listing.png' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poster = (listing as any)['profiles!listings_poster_id_fkey'] ?? listing.profiles ?? null

  const flatTypeLabel = FLAT_TYPE_LABELS[listing.room_type] ?? listing.room_type
  const furnishedLabel = FURNISHED_LABELS[listing.furnished] ?? listing.furnished
  const genderLabel = GENDER_LABELS[listing.gender_allowed] ?? listing.gender_allowed
  const waterLabel = WATER_LABELS[listing.water_supply] ?? listing.water_supply
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerProximityLabel = (listing as any).owner_proximity
    ? OWNER_PROXIMITY_LABELS[(listing as any).owner_proximity] ?? (listing as any).owner_proximity
    : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const personsStaying: number | null = (listing as any).persons_staying ?? null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasBalcony: boolean = (listing as any).has_balcony ?? false

  return (
    <div className="min-h-screen bg-muted-bg pb-16">

      {/* Back button bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-border-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center">
          <BackButton />
        </div>
      </div>

      {/* Hero Images — with gallery trigger */}
      <ListingHero photos={images} title={listing.title} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content (Left) */}
          <div className="flex-1 space-y-8">

            {/* Title & badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-navy text-white text-xs font-bold uppercase tracking-wider rounded-md">
                  {flatTypeLabel}
                </span>
                <span className="px-3 py-1 bg-border text-text-primary text-xs font-bold uppercase tracking-wider rounded-md">
                  {genderLabel}
                </span>
                {listing.is_verified && (
                  <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 leading-tight">
                {listing.title}
              </h1>
              <div className="flex items-start gap-2 text-text-muted">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-lg">{listing.address}</p>
              </div>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white border border-border-light rounded-2xl shadow-sm">
              <div className="space-y-1">
                <p className="text-sm text-text-muted font-medium">Rent</p>
                <p className="text-2xl font-bold text-navy">₹{listing.rent.toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-text-muted font-medium">Deposit</p>
                <p className="text-2xl font-bold text-text-primary">₹{listing.deposit.toLocaleString('en-IN')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-text-muted font-medium">Distance to NFSU</p>
                <p className="text-xl font-bold text-text-primary">
                  {listing.distance_from_college ? `${listing.distance_from_college.toFixed(1)} km` : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-text-muted font-medium">Available</p>
                <p className="text-xl font-bold text-text-primary">
                  {listing.available_from
                    ? new Date(listing.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Immediately'}
                </p>
              </div>
            </div>

            {/* About */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-text-primary">About this property</h2>
              <p className="text-text-muted leading-relaxed whitespace-pre-wrap">
                {listing.description || 'No description provided.'}
              </p>
            </div>

            {/* Property details */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-text-primary">Property Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                {/* Flat type */}
                <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                  <Home className="w-5 h-5 text-coral shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted font-medium">Type</p>
                    <p className="font-semibold text-sm text-text-primary">{flatTypeLabel}</p>
                  </div>
                </div>

                {/* Furnishing */}
                <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                  <Home className="w-5 h-5 text-coral shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted font-medium">Furnishing</p>
                    <p className="font-semibold text-sm text-text-primary">{furnishedLabel}</p>
                  </div>
                </div>

                {/* Roommates needed */}
                <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                  <Users className="w-5 h-5 text-coral shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted font-medium">Roommates Needed</p>
                    <p className="font-semibold text-sm text-text-primary">{listing.roommates_needed}</p>
                  </div>
                </div>

                {/* Persons currently staying */}
                {personsStaying !== null && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                    <UserCheck className="w-5 h-5 text-coral shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted font-medium">Currently Staying</p>
                      <p className="font-semibold text-sm text-text-primary">{personsStaying} person{personsStaying !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}

                {/* Owner proximity */}
                {ownerProximityLabel && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                    <Building2 className="w-5 h-5 text-coral shrink-0" />
                    <div>
                      <p className="text-xs text-text-muted font-medium">Owner Location</p>
                      <p className="font-semibold text-sm text-text-primary">{ownerProximityLabel}</p>
                    </div>
                  </div>
                )}

                {/* Balcony */}
                <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                  <Wind className="w-5 h-5 text-coral shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted font-medium">Balcony</p>
                    <p className={`font-semibold text-sm ${hasBalcony ? 'text-success' : 'text-text-muted'}`}>
                      {hasBalcony ? 'Available' : 'Not available'}
                    </p>
                  </div>
                </div>


                {/* Water */}
                <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                  <Droplets className="w-5 h-5 text-coral shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted font-medium">Water Supply</p>
                    <p className="font-semibold text-sm text-text-primary">{waterLabel}</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-text-primary">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.has_wifi && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                    <Wifi className="w-5 h-5 text-coral shrink-0" />
                    <span className="font-medium text-sm">Wi-Fi</span>
                  </div>
                )}
                {listing.has_ac && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                    <Thermometer className="w-5 h-5 text-coral shrink-0" />
                    <span className="font-medium text-sm">Air Conditioning</span>
                  </div>
                )}
                {listing.food_available && (
                  <div className="flex items-center gap-3 p-4 bg-white border border-border-light rounded-xl">
                    <Utensils className="w-5 h-5 text-coral shrink-0" />
                    <span className="font-medium text-sm">Food Provided</span>
                  </div>
                )}
                {!listing.has_wifi && !listing.has_ac && !listing.food_available && (
                  <p className="text-text-muted text-sm col-span-full">No special amenities listed.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="sticky top-6 space-y-6">
              
              <div className="bg-white border border-border-light rounded-2xl shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Listed By</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-muted-bg rounded-full overflow-hidden shrink-0 border border-border-light relative">
                    {poster?.avatar_url ? (
                      <Image src={poster.avatar_url} alt={poster.name || ''} fill className="object-cover" />
                    ) : (
                      <UserCircle2 className="w-full h-full text-text-muted p-2" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-lg text-text-primary">{poster?.name || 'User'}</p>
                      {poster?.verification_badge && <ShieldCheck className="w-4 h-4 text-success" />}
                    </div>
                    <p className="text-sm text-text-muted capitalize">{poster?.role.toLowerCase()}</p>
                  </div>
                </div>

                <ListingContactButton 
                  listingId={listing.id} 
                  isLoggedIn={!!user}
                  isVerifiedUser={isVerifiedUser}
                  isOwnListing={user?.id === listing.poster_id}
                />
              </div>

              <div className="bg-white border border-border-light rounded-2xl shadow-sm overflow-hidden p-6 text-center">
                <ShieldCheck className="w-8 h-8 text-success mx-auto mb-2" />
                <h4 className="font-bold text-text-primary mb-1">Stay Safe</h4>
                <p className="text-xs text-text-muted mb-4">
                  Never transfer money before viewing the property in person and signing an agreement.
                </p>
                <ReportListingButton listingId={listing.id} isLoggedIn={!!user} />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
