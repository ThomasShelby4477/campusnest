'use client'

import { useState, useEffect } from 'react'
import { MapPin, CheckCircle2 } from 'lucide-react'

export function HeroCarousel({ listings }: { listings: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!listings || listings.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % listings.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [listings])

  if (!listings || listings.length === 0) {
    // Fallback static card if no listings are found
    return (
      <div className="relative w-[380px] h-[480px]">
        <div className="absolute top-8 left-8 w-full h-full rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm transform rotate-6" />
        <div className="absolute top-4 left-4 w-full h-full rounded-3xl bg-white/10 border border-white/10 backdrop-blur-sm transform rotate-3" />
        <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 backdrop-blur-md p-8 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex gap-2 mb-6">
              <span className="bg-coral/90 text-white px-3 py-1 rounded-full text-xs font-bold">PG</span>
              <span className="bg-success/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sunny PG Near Gate 2</h3>
            <p className="text-white/60 text-sm mb-4 flex items-center gap-1">
              <MapPin className="w-4 h-4" /> 0.8 km from NFSU
            </p>
            <p className="text-3xl font-black text-white">
              ₹6,500<span className="text-base font-normal text-white/50">/mo</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-coral/30 flex items-center justify-center text-white font-bold">R</div>
            <div>
              <p className="text-white font-bold text-sm">Rahul S.</p>
              <p className="text-white/50 text-xs">NFSU '26 • Cybersecurity</p>
            </div>
          </div>
          <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-coral/20 blur-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-[380px] h-[480px] perspective-[1000px]">
      {listings.map((listing, index) => {
        // Calculate relative position: 0 is front, 1 is middle, 2 is back
        // Using modulo to wrap around correctly based on activeIndex
        let offset = (index - activeIndex + listings.length) % listings.length
        
        // If there are more than 3 listings, anything beyond 2 is hidden
        const isHidden = offset > 2

        // Visual styles based on stack position
        const scale = 1 - offset * 0.05
        const translateY = offset * 24
        const translateX = offset * 24
        const rotate = offset * 3
        const opacity = isHidden ? 0 : 1 - offset * 0.2
        const zIndex = 30 - offset

        return (
          <div
            key={listing.id}
            className="absolute top-0 left-0 w-full h-full rounded-3xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 backdrop-blur-md p-8 flex flex-col justify-between overflow-hidden transition-all duration-700 ease-in-out origin-top-left"
            style={{
              transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
              opacity,
              zIndex,
              boxShadow: offset === 0 ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : 'none'
            }}
          >
            <div>
              <div className="flex gap-2 mb-6">
                <span className="bg-coral/90 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                  {listing.room_type}
                </span>
                {listing.owner?.verified_status === 'VERIFIED' && (
                  <span className="bg-success/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2">{listing.title}</h3>
              <p className="text-white/60 text-sm mb-4 flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {listing.distance_from_college ? `${listing.distance_from_college.toFixed(1)} km from Campus` : 'Near Campus'}
              </p>
              <p className="text-3xl font-black text-white">
                ₹{listing.rent.toLocaleString('en-IN')}
                <span className="text-base font-normal text-white/50">/mo</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {listing.owner?.avatar_url ? (
                 <img src={listing.owner.avatar_url} alt={listing.owner.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-coral/30 flex items-center justify-center text-white font-bold uppercase">
                  {listing.owner?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-sm">{listing.owner?.name || 'User'}</p>
                <p className="text-white/50 text-xs">
                  {listing.owner?.year ? `Year ${listing.owner.year}` : ''} 
                  {listing.owner?.branch ? ` • ${listing.owner.branch}` : ''}
                </p>
              </div>
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-coral/20 blur-xl pointer-events-none" />
          </div>
        )
      })}
    </div>
  )
}
