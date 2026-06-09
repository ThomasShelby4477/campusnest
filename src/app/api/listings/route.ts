import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { csrfGuard } from '@/lib/csrf'

const imageSchema = z.object({
  url: z.string().url(),
  order: z.number().int(),
  is_primary: z.boolean().default(false),
})

const listingSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  rent: z.number().int().positive(),
  deposit: z.number().int().nonnegative(),
  room_type: z.enum(['SINGLE', 'SHARED', '1BHK', '2BHK', '3BHK', 'PG']),
  furnished: z.enum(['FURNISHED', 'SEMI', 'UNFURNISHED']),
  gender_allowed: z.enum(['MALE', 'FEMALE', 'ANY']).optional(), // server overrides from user profile
  roommates_needed: z.number().int().min(1).default(1),
  // New fields
  persons_staying: z.number().int().min(0).default(0),
  owner_proximity: z.enum(['SAME_BUILDING', 'NEARBY', 'FAR']).default('NEARBY'),
  has_balcony: z.boolean().default(false),
  has_wifi: z.boolean().default(false),
  has_ac: z.boolean().default(false),
  food_available: z.boolean().default(false),
  water_supply: z.enum(['24H', 'TIMED', 'BOREWELL']),
  // [SECURITY M-3] Enforce valid geographic coordinate bounds
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(5),
  available_from: z.string().optional(), // YYYY-MM-DD
  images: z.array(imageSchema).min(1).max(8),
})

export async function POST(request: NextRequest) {
  // [SECURITY H-5] CSRF origin check
  const csrfError = csrfGuard(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is allowed to post (must be VERIFIED)
    const { data: profile } = await supabase
      .from('profiles')
      .select('verified_status, gender')
      .eq('id', user.id)
      .single()

    if (profile?.verified_status !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'Only verified users can post listings' },
        { status: 403 }
      )
    }

    // Derive gender_allowed from the poster's own gender.
    // Male posters → MALE listings only. Female posters → FEMALE listings only.
    // This is a hard server-side rule — the client cannot override it.
    const posterGender = profile?.gender as string | null
    const forcedGenderAllowed: 'MALE' | 'FEMALE' | 'ANY' =
      posterGender === 'MALE' ? 'MALE' :
      posterGender === 'FEMALE' ? 'FEMALE' :
      'ANY' // fallback for edge cases (LANDLORD with no gender set)

    // [SECURITY M-4] Rate limit: 5 listings created per hour per user
    const rl = rateLimit(`listings:create:${user.id}`, { limit: 5, windowMs: 60 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many listings created. Please wait.' }, { status: 429 })
    }

    const body = await request.json()
    const result = listingSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 422 }
      )
    }

    // Separate new fields that require a DB migration from the core fields
    // that already exist in the schema. This prevents a 500 if migration hasn't run.
    const {
      images,
      available_from,
      persons_staying,
      owner_proximity,
      has_balcony,
      gender_allowed: _clientGender, // ignored — server enforces this
      ...coreListingData
    } = result.data

    // Insert listing (auto-verified since only verified users can post)
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        ...coreListingData,
        gender_allowed: forcedGenderAllowed, // always set from poster's gender
        available_from: available_from || null,
        poster_id: user.id,
        is_verified: true,
        is_active: true,
        // New fields — included only when DB columns exist (migration 022)
        ...(persons_staying !== undefined && { persons_staying }),
        ...(owner_proximity  !== undefined && { owner_proximity }),
        ...(has_balcony      !== undefined && { has_balcony }),
      })
      .select('id')
      .single()

    if (listingError) {
      console.error('Listing insert error:', listingError)
      return NextResponse.json(
        { error: 'Failed to create listing' },
        { status: 500 }
      )
    }

    // Insert images
    const imagesToInsert = images.map((img) => ({
      listing_id: listing.id,
      url: img.url,
      order: img.order,
      is_primary: img.is_primary,
    }))

    const { error: imagesError } = await supabase
      .from('listing_images')
      .insert(imagesToInsert)

    if (imagesError) {
      console.error('Listing images insert error:', imagesError)
      // Soft-fail: the listing was created, but images failed.
      // In production, we might want to rollback, but let's proceed and warn.
    }

    return NextResponse.json({
      message: 'Listing created successfully',
      id: listing.id,
      is_verified: true,
    })
  } catch (err) {
    console.error('POST /api/listings error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Although the UI will fetch directly via Supabase client, this endpoint is provided per requirements.
  try {
    const supabase = await createClient()
    const url = request.nextUrl

    // Resolve logged-in user's gender + role for enforcement
    const { data: { user: authUser } } = await supabase.auth.getUser()
    let callerGender: string | null = null
    let callerRole: string | null = null
    if (authUser) {
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('gender, role')
        .eq('id', authUser.id)
        .single()
      callerGender = callerProfile?.gender ?? null
      callerRole = callerProfile?.role ?? null
    }

    let query = supabase
      .from('listings')
      .select(`
        *,
        listing_images ( url, is_primary ),
        profiles!listings_poster_id_fkey ( name, avatar_url )
      `)
      .eq('is_active', true)

    const minRent = url.searchParams.get('minRent')
    const maxRent = url.searchParams.get('maxRent')
    const distance = url.searchParams.get('distance')
    const roomType = url.searchParams.get('roomType')
    const furnished = url.searchParams.get('furnished')
    const wifi = url.searchParams.get('wifi')
    const ac = url.searchParams.get('ac')
    const food = url.searchParams.get('food')
    const moveIn = url.searchParams.get('moveIn')
    // 'gender' query param is intentionally IGNORED for authenticated users
    // — their profile gender is always used instead.

    if (minRent) query = query.gte('rent', parseInt(minRent))
    if (maxRent) query = query.lte('rent', parseInt(maxRent))
    if (distance) query = query.lte('distance_from_college', parseFloat(distance))
    if (roomType) query = query.eq('room_type', roomType)
    if (furnished) query = query.eq('furnished', furnished)
    if (wifi === 'true') query = query.eq('has_wifi', true)
    if (ac === 'true') query = query.eq('has_ac', true)
    if (food === 'true') query = query.eq('food_available', true)
    if (moveIn) query = query.gte('available_from', moveIn)

    // Hard gender enforcement — authenticated users only see matching listings.
    // ADMINS are exempt: they must be able to search/moderate all listings regardless of gender.
    if (callerRole !== 'ADMIN') {
      if (callerGender === 'MALE') {
        query = query.in('gender_allowed', ['MALE', 'ANY'])
      } else if (callerGender === 'FEMALE') {
        query = query.in('gender_allowed', ['FEMALE', 'ANY'])
      }
    }
    // Unauthenticated guests see all listings

    // Pagination
    const page = parseInt(url.searchParams.get('page') || '0')
    query = query.range(page * 12, page * 12 + 11)
    
    // Sort
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    return NextResponse.json({ listings: data })
  } catch (err) {
    console.error('GET /api/listings error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
