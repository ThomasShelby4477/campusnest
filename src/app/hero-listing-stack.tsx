'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, CheckCircle2, Wifi, Wind, Utensils } from 'lucide-react'

interface Listing {
  id: string
  title: string
  address: string
  rent: number
  room_type: string
  verified_status: string
  distance_from_college: number | null
  images: { url: string; is_primary: boolean }[]
  has_wifi: boolean
  has_ac: boolean
  food_available: boolean
  gender_allowed: string
}

const ROOM_COLORS: Record<string, string> = {
  PG: 'bg-coral/90',
  SHARED: 'bg-purple-500/90',
  '1BHK': 'bg-sky-500/90',
  '2BHK': 'bg-emerald-500/90',
  '3BHK': 'bg-amber-500/90',
  SINGLE: 'bg-pink-500/90',
}

export function HeroListingStack() {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/listings/featured')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.listings) && d.listings.length > 0) {
          setListings(d.listings)
        }
      })
      .catch(() => {})
  }, [])

  // Auto-cycle every 3 seconds
  useEffect(() => {
    if (listings.length < 2) return
    intervalRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % listings.length)
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [listings.length])

  if (listings.length === 0) {
    // Skeleton placeholder while loading
    return (
      <div className="relative w-[380px] h-[460px] animate-pulse">
        <div className="absolute top-8 left-8 w-full h-full rounded-3xl bg-white/5 border border-white/10 transform rotate-6" />
        <div className="absolute top-4 left-4 w-full h-full rounded-3xl bg-white/10 border border-white/10 transform rotate-3" />
        <div className="relative w-full h-full rounded-3xl bg-white/10 border border-white/20" />
      </div>
    )
  }

  const visibleCount = Math.min(listings.length, 3)

  return (
    <div className="relative w-[380px] h-[460px]">
      {/* Render up to 3 cards in the stack (back → front) */}
      {Array.from({ length: visibleCount }).map((_, stackPos) => {
        const cardIdx = (activeIdx + (visibleCount - 1 - stackPos)) % listings.length
        const listing = listings[cardIdx]
        const isFront = stackPos === visibleCount - 1
        const primaryImage = listing.images?.find(img => img.is_primary)?.url || listing.images?.[0]?.url

        // position offsets for depth effect
        const offset = (visibleCount - 1 - stackPos) * 10
        const rotate = (visibleCount - 1 - stackPos) * 3

        return (
          <div
            key={listing.id}
            onClick={() => {
              if (isFront) router.push(`/listings/${listing.id}`)
            }}
            className={`absolute w-full h-full rounded-3xl overflow-hidden border border-white/20 backdrop-blur-md transition-all duration-700 ${isFront ? 'cursor-pointer hover:border-coral/50' : ''}`}
            style={{
              top: `${offset}px`,
              left: `${offset}px`,
              transform: `rotate(${rotate}deg)`,
              zIndex: stackPos + 1,
              background: isFront
                ? 'linear-gradient(145deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.95) 100%)'
                : `rgba(15,23,42,${0.55 + stackPos * 0.1})`,
            }}
          >
            {/* Image area */}
            {primaryImage && isFront && (
              <div className="absolute inset-0">
                <Image
                  src={primaryImage}
                  alt={listing.title}
                  fill
                  className="object-cover opacity-[0.35]"
                  sizes="380px"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-navy/40 via-navy/70 to-navy/98" />
              </div>
            )}

            {isFront && (
              <div className="relative z-10 h-full p-7 flex flex-col justify-between">
                <div>
                  {/* Badges */}
                  <div className="flex gap-2 mb-5">
                    <span className={`${ROOM_COLORS[listing.room_type] || 'bg-coral/90'} text-white px-3 py-1 rounded-full text-xs font-bold`}>
                      {listing.room_type}
                    </span>
                    {listing.verified_status === 'VERIFIED' && (
                      <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-xs font-medium">
                      {listing.gender_allowed === 'ANY' ? 'Co-ed' : listing.gender_allowed === 'MALE' ? 'Boys' : 'Girls'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight drop-shadow">{listing.title}</h3>
                  <p className="text-white/80 text-sm mb-4 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{listing.address}</span>
                  </p>

                  {listing.distance_from_college != null && (
                    <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 text-xs text-white font-semibold mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral inline-block" />
                      {listing.distance_from_college.toFixed(1)} km from campus
                    </div>
                  )}

                  {/* Amenity pills */}
                  <div className="flex gap-2 flex-wrap">
                    {listing.has_wifi && (
                      <span className="bg-white/15 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1 font-medium">
                        <Wifi className="w-3 h-3" /> WiFi
                      </span>
                    )}
                    {listing.has_ac && (
                      <span className="bg-white/15 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1 font-medium">
                        <Wind className="w-3 h-3" /> AC
                      </span>
                    )}
                    {listing.food_available && (
                      <span className="bg-white/15 text-white px-2.5 py-1 rounded-full text-xs flex items-center gap-1 font-medium">
                        <Utensils className="w-3 h-3" /> Food
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <p className="text-3xl font-black text-white">
                    ₹{listing.rent.toLocaleString('en-IN')}
                    <span className="text-base font-normal text-white/50">/mo</span>
                  </p>
                  {/* Dot indicators */}
                  {listings.length > 1 && (
                    <div className="flex gap-1.5 mt-4">
                      {listings.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (intervalRef.current) clearInterval(intervalRef.current)
                            setActiveIdx(dotIdx)
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${dotIdx === activeIdx ? 'w-6 bg-coral' : 'w-1.5 bg-white/30'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Glow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-24 bg-coral/20 blur-2xl rounded-full pointer-events-none" />
    </div>
  )
}
