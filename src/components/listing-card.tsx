'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Heart, MapPin, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ListingCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing: any
  currentUserId?: string
  initialSaved?: boolean
  /** When provided, card click calls this instead of navigating to the detail page */
  onSelect?: () => void
}

export function ListingCard({ listing, currentUserId, initialSaved = false, onSelect }: ListingCardProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryImage = listing.listing_images?.find((img: any) => img.is_primary)?.url 
    || listing.listing_images?.[0]?.url 
    || '/placeholder-listing.png'

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigation if wrapped in Link
    if (!currentUserId) {
      toast.error('Log in to save listings')
      return
    }

    const newSavedState = !isSaved
    setIsSaved(newSavedState) // optimistic update

    const supabase = createClient()
    try {
      if (newSavedState) {
        const { error } = await supabase
          .from('saved_listings')
          .insert({ user_id: currentUserId, listing_id: listing.id })
        if (error) throw error
        toast.success('Saved to favorites')
      } else {
        const { error } = await supabase
          .from('saved_listings')
          .delete()
          .match({ user_id: currentUserId, listing_id: listing.id })
        if (error) throw error
        toast.info('Removed from favorites')
      }
    } catch (err) {
      console.error(err)
      setIsSaved(!newSavedState) // revert optimistic update
      toast.error('Failed to update favorites')
    }
  }

  const inner = (
    <div className="bg-white rounded-xl border border-border-light overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted-bg">
          <Image
            src={primaryImage}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-semibold text-navy shadow-sm">
              {listing.room_type}
            </span>
          </div>

          {listing.is_verified && (
            <div className="absolute top-3 right-3 bg-success/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-sm">
              <CheckCircle className="w-3 h-3" />
              Verified
            </div>
          )}

          {/* Heart button */}
          <button
            onClick={toggleSave}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
            aria-label={isSaved ? "Remove from saved" : "Save listing"}
          >
            <Heart 
              className={`w-4 h-4 transition-colors ${isSaved ? 'fill-coral text-coral' : 'text-text-muted hover:text-coral'}`} 
            />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-semibold text-text-primary text-lg leading-tight line-clamp-1 group-hover:text-coral transition-colors">
              {listing.title}
            </h3>
            <p className="font-bold text-navy whitespace-nowrap text-lg">
              ₹{listing.rent}<span className="text-sm font-normal text-text-muted">/mo</span>
            </p>
          </div>

          <div className="flex items-center gap-1 text-text-muted text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{listing.address}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-border-light flex items-center justify-between text-xs font-medium text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-1 bg-muted-bg rounded">
                {listing.gender_allowed === 'ANY' ? 'Co-ed' : listing.gender_allowed}
              </span>
              <span className="px-2 py-1 bg-muted-bg rounded">
                {listing.furnished}
              </span>
            </div>
            {listing.distance_from_college !== null && (
              <span className="text-navy bg-navy/5 px-2 py-1 rounded">
                {listing.distance_from_college.toFixed(1)} km to NFSU
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (onSelect) {
    return (
      <div className="group block cursor-pointer" onClick={onSelect}>
        {inner}
      </div>
    )
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      {inner}
    </Link>
  )
}
