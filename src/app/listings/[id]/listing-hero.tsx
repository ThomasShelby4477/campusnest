'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Images } from 'lucide-react'
import { PhotoGalleryModal } from '@/components/photo-gallery-modal'

interface Photo {
  url: string
  order?: number
  is_primary?: boolean
}

interface ListingHeroProps {
  photos: Photo[]
  title: string
}

export function ListingHero({ photos, title }: ListingHeroProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  const openGallery = (index = 0) => {
    setStartIndex(index)
    setGalleryOpen(true)
  }

  return (
    <>
      {/* Hero Image strip — click any image to open gallery */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] bg-black group">
        {/* Scrollable images */}
        <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory">
          {photos.map((img, i) => (
            <button
              key={i}
              onClick={() => openGallery(i)}
              className="relative min-w-full h-full snap-center shrink-0 cursor-zoom-in focus:outline-none"
              aria-label={`View photo ${i + 1} of ${photos.length}`}
            >
              <Image
                src={img.url}
                alt={`${title} — photo ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                priority={i === 0}
                sizes="100vw"
              />
            </button>
          ))}
        </div>

        {/* Dot indicators (show current image in scroll) */}
        {photos.length > 1 && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {photos.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-200 ${
                  i === 0
                    ? 'w-4 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {/* ── "View all X photos" button ─────────────────── */}
        <button
          onClick={() => openGallery(0)}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-sm font-semibold rounded-xl border border-white/20 hover:border-white/40 transition-all duration-200 hover:scale-105 shadow-lg"
          aria-label={`View all ${photos.length} photos`}
        >
          <Images className="w-4 h-4" />
          <span>View all {photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </button>

        {/* Gradient scrim for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Gallery Modal (portal rendered via fixed positioning) */}
      {galleryOpen && (
        <PhotoGalleryModal
          photos={photos}
          initialIndex={startIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  )
}
