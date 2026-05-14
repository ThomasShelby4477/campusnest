'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Heart, MapPin, CheckCircle, Wifi, Wind, UtensilsCrossed, BedDouble } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ListingCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing: any
  currentUserId?: string
  initialSaved?: boolean
  /** When provided, card click calls this instead of navigating */
  onSelect?: () => void
}

export function ListingCard({ listing, currentUserId, initialSaved = false, onSelect }: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)

  const primaryImage =
    listing.listing_images?.find((img: any) => img.is_primary)?.url ??
    listing.listing_images?.[0]?.url ??
    '/placeholder-listing.png'

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!currentUserId) { toast.error('Log in to save listings'); return }
    const next = !isSaved
    setIsSaved(next)
    const supabase = createClient()
    try {
      if (next) {
        await supabase.from('saved_listings').insert({ user_id: currentUserId, listing_id: listing.id })
        toast.success('Saved!')
      } else {
        await supabase.from('saved_listings').delete().match({ user_id: currentUserId, listing_id: listing.id })
        toast.info('Removed from saved')
      }
    } catch {
      setIsSaved(!next)
      toast.error('Failed to update')
    }
  }

  const genderLabel = listing.gender_allowed === 'ANY' ? 'Co-ed' : listing.gender_allowed === 'MALE' ? 'Boys' : 'Girls'

  const inner = (
    <div className="group flex bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">

      {/* Image */}
      <div className="relative w-[38%] shrink-0 bg-muted-bg overflow-hidden">
        <Image
          src={primaryImage}
          alt={listing.title}
          fill
          sizes="200px"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {listing.is_verified && (
          <div className="absolute top-2 left-2 bg-success text-white px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" /> Verified
          </div>
        )}
        <button
          onClick={toggleSave}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 active:scale-95 transition-transform"
          aria-label={isSaved ? 'Unsave' : 'Save'}
        >
          <Heart className={`w-3.5 h-3.5 transition-all duration-200 ${isSaved ? 'fill-coral text-coral scale-110' : 'text-text-muted'}`} />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 min-w-0">
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-navy/10 text-navy text-[11px] font-semibold rounded-full">{listing.room_type}</span>
          <span className="px-2 py-0.5 bg-muted-bg text-text-muted text-[11px] font-medium rounded-full">{genderLabel}</span>
          <span className="px-2 py-0.5 bg-muted-bg text-text-muted text-[11px] font-medium rounded-full">{listing.furnished}</span>
        </div>

        <h3 className="font-bold text-text-primary text-sm leading-snug line-clamp-2 group-hover:text-coral transition-colors duration-200 mb-1">
          {listing.title}
        </h3>

        <div className="flex items-start gap-1 text-text-muted mb-2">
          <MapPin className="w-3 h-3 shrink-0 mt-[3px]" />
          <span className="text-[11px] line-clamp-1">{listing.address}</span>
        </div>

        <div className="flex items-center gap-2 mb-2.5">
          {listing.has_wifi && (
            <Tooltip>
              <TooltipTrigger><Wifi className="w-3.5 h-3.5 text-success cursor-default" /></TooltipTrigger>
              <TooltipContent>WiFi included</TooltipContent>
            </Tooltip>
          )}
          {listing.has_ac && (
            <Tooltip>
              <TooltipTrigger><Wind className="w-3.5 h-3.5 text-blue-400 cursor-default" /></TooltipTrigger>
              <TooltipContent>Air Conditioning</TooltipContent>
            </Tooltip>
          )}
          {listing.food_available && (
            <Tooltip>
              <TooltipTrigger><UtensilsCrossed className="w-3.5 h-3.5 text-orange-400 cursor-default" /></TooltipTrigger>
              <TooltipContent>Food available</TooltipContent>
            </Tooltip>
          )}
          {listing.roommates_needed > 1 && (
            <span className="flex items-center gap-0.5 text-[11px] text-text-muted">
              <BedDouble className="w-3.5 h-3.5" /> {listing.roommates_needed}
            </span>
          )}
          {listing.distance_from_college != null && (
            <span className="ml-auto text-[11px] font-medium text-navy bg-navy/5 px-1.5 py-0.5 rounded-full">
              {listing.distance_from_college.toFixed(1)} km
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <span className="text-lg font-black text-navy">₹{listing.rent.toLocaleString('en-IN')}</span>
            <span className="text-[11px] text-text-muted font-normal"> /mo</span>
          </div>
          {listing.deposit > 0 && (
            <span className="text-[11px] text-text-muted">Dep. ₹{listing.deposit.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </div>
  )

  if (onSelect) {
    return <div onClick={onSelect}>{inner}</div>
  }

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      {inner}
    </Link>
  )
}
