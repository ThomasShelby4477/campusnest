'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MapPin, CheckCircle2, Wifi, Wind, Utensils } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'

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
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!api) return

    setCurrent(api.selectedScrollSnap())

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  useEffect(() => {
    if (!api || isHovered) return

    const interval = setInterval(() => {
      api.scrollNext()
    }, 4000)

    return () => clearInterval(interval)
  }, [api, isHovered])

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

  return (
    <div 
      className="relative w-[380px] h-[460px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
        className="w-full h-full"
      >
        <CarouselContent className="h-full ml-0">
          {listings.map((listing) => {
            const primaryImage = listing.images?.find(img => img.is_primary)?.url || listing.images?.[0]?.url
            return (
              <CarouselItem key={listing.id} className="pl-0 h-[460px] w-full">
                <div
                  onClick={() => router.push(`/search?listingId=${listing.id}`)}
                  className="relative w-full h-full rounded-3xl overflow-hidden border border-white/20 backdrop-blur-md cursor-pointer hover:border-coral/50 transition-colors group"
                >
                  {/* Image area */}
                  {primaryImage && (
                    <div className="absolute inset-0">
                      <Image
                        src={primaryImage}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="380px"
                      />
                    </div>
                  )}

                  <div className="relative z-10 h-full flex flex-col justify-between">
                    {/* Top Badges */}
                    <div className="p-5 flex gap-2 flex-wrap">
                      <span className={`${ROOM_COLORS[listing.room_type] || 'bg-coral/90'} text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm`}>
                        {listing.room_type}
                      </span>
                      {listing.verified_status === 'VERIFIED' && (
                        <span className="bg-emerald-500/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                      <span className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-white/10">
                        {listing.gender_allowed === 'ANY' ? 'Co-ed' : listing.gender_allowed === 'MALE' ? 'Boys' : 'Girls'}
                      </span>
                    </div>

                    {/* Bottom Info Panel */}
                    <div className="p-5 bg-navy/85 backdrop-blur-xl border-t border-white/10 rounded-b-3xl">
                      <h3 className="text-xl font-black text-white mb-1.5 line-clamp-1">{listing.title}</h3>
                      <p className="text-white/80 text-sm mb-4 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{listing.address}</span>
                      </p>

                      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
                        {listing.distance_from_college != null && (
                          <span className="shrink-0 inline-flex items-center gap-1 bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-white font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-coral inline-block" />
                            {listing.distance_from_college.toFixed(1)} km
                          </span>
                        )}
                        {listing.has_wifi && (
                          <span className="shrink-0 bg-white/10 border border-white/10 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-medium">
                            <Wifi className="w-3 h-3" /> WiFi
                          </span>
                        )}
                        {listing.has_ac && (
                          <span className="shrink-0 bg-white/10 border border-white/10 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-medium">
                            <Wind className="w-3 h-3" /> AC
                          </span>
                        )}
                        {listing.food_available && (
                          <span className="shrink-0 bg-white/10 border border-white/10 text-white px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-medium">
                            <Utensils className="w-3 h-3" /> Food
                          </span>
                        )}
                      </div>

                      <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-white">
                          ₹{listing.rent.toLocaleString('en-IN')}
                          <span className="text-sm font-normal text-white/50 ml-1">/mo</span>
                        </p>
                        
                        {/* Dot indicators */}
                        {listings.length > 1 && (
                          <div className="flex gap-1.5 mb-1.5 relative z-20">
                            {listings.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  api?.scrollTo(dotIdx)
                                }}
                                className={`h-1.5 rounded-full transition-all duration-300 ${dotIdx === current ? 'w-5 bg-coral' : 'w-1.5 bg-white/20 hover:bg-white/40'}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Glow */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-24 bg-coral/20 blur-2xl rounded-full pointer-events-none" />
    </div>
  )
}
