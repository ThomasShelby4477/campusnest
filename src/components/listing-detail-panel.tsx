'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, MapPin, Wifi, Wind, UtensilsCrossed, Droplets, Heart, CheckCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing: any
  currentUserId?: string
  initialSaved?: boolean
  onClose: () => void
}

export function ListingDetailPanel({ listing, currentUserId, initialSaved = false, onClose }: Props) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [imgIndex, setImgIndex] = useState(0)

  const images: string[] = listing.listing_images?.map((i: any) => i.url) ?? []
  const displayImg = images[imgIndex] || '/placeholder-listing.png'

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
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
    } catch { setIsSaved(!next); toast.error('Failed') }
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Image carousel */}
      <div className="relative aspect-[16/9] bg-muted-bg shrink-0">
        <Image src={displayImg} alt={listing.title} fill className="object-cover" />

        {/* Close */}
        <button onClick={onClose} className="absolute top-3 left-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition z-10">
          <X className="w-4 h-4" />
        </button>

        {/* Save */}
        <button onClick={toggleSave} className="absolute top-3 right-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition z-10">
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-coral text-coral' : ''}`} />
        </button>

        {/* Image nav */}
        {images.length > 1 && (
          <>
            <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} disabled={imgIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))} disabled={imgIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        {/* Badges */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-semibold text-navy">{listing.room_type}</span>
          {listing.is_verified && (
            <span className="bg-success/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title + Rent */}
        <div className="flex justify-between items-start gap-2">
          <h2 className="font-bold text-text-primary text-lg leading-tight">{listing.title}</h2>
          <div className="text-right shrink-0">
            <p className="font-bold text-navy text-xl">₹{listing.rent}<span className="text-sm font-normal text-text-muted">/mo</span></p>
            {listing.deposit > 0 && <p className="text-xs text-text-muted">Deposit: ₹{listing.deposit}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-1.5 text-sm text-text-muted">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{listing.address}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {[
            listing.furnished,
            listing.gender_allowed === 'ANY' ? 'Co-ed' : listing.gender_allowed,
            listing.water_supply,
            listing.roommates_needed > 1 ? `${listing.roommates_needed} roommates` : '1 person',
          ].map(tag => tag && (
            <span key={tag} className="px-2.5 py-1 bg-muted-bg rounded-full text-xs font-medium text-text-primary">{tag}</span>
          ))}
        </div>

        {/* Amenities */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Wifi, label: 'WiFi', active: listing.has_wifi },
            { icon: Wind, label: 'AC', active: listing.has_ac },
            { icon: UtensilsCrossed, label: 'Food', active: listing.food_available },
            { icon: Droplets, label: '24h Water', active: listing.water_supply === '24H' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${active ? 'bg-success/10 text-success' : 'bg-muted-bg text-text-muted line-through'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </div>
          ))}
        </div>

        {/* Description */}
        {listing.description && (
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">About</p>
            <p className="text-sm text-text-primary leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Distance */}
        {listing.distance_from_college != null && (
          <p className="text-sm text-navy bg-navy/5 px-3 py-2 rounded-lg font-medium">
            📍 {listing.distance_from_college.toFixed(1)} km from NFSU Campus
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="p-4 border-t border-border-light shrink-0">
        <Link href={`/listings/${listing.id}`} className="block">
          <Button className="w-full bg-coral hover:bg-coral-dark text-white gap-2">
            View Full Details <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
