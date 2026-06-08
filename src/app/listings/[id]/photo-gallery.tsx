'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Grid2X2, ChevronLeft, ChevronRight, XIcon } from 'lucide-react'

export function PhotoGallery({ images }: { images: { url: string }[] }) {
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const handlePrev = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if (!val) setSelectedIndex(null)
    }}>
      <DialogTrigger 
        render={
          <Button variant="secondary" className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/90 hover:bg-white text-navy font-semibold shadow-md" />
        }
      >
        <Grid2X2 className="w-4 h-4" />
        Show all photos
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] h-[90vh] p-0 bg-black/95 border-none text-white [&>button]:text-white flex flex-col">
        <DialogTitle className="sr-only">Property Photos Gallery</DialogTitle>
        
        {selectedIndex === null ? (
          // Grid View
          <div className="flex-1 overflow-y-auto p-4 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((img, i) => (
                <button
                  key={i} 
                  className="relative aspect-video w-full rounded-xl overflow-hidden bg-white/5 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedIndex(i)}
                >
                  <Image
                    src={img.url}
                    alt={`Property photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Enlarged View
          <div className="flex-1 flex flex-col relative w-full h-full">
            {/* Header for enlarged view */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedIndex(null)}
                className="text-white hover:bg-white/20"
              >
                <Grid2X2 className="w-4 h-4 mr-2" />
                Back to grid
              </Button>
              <span className="text-sm font-medium">
                {selectedIndex + 1} / {images.length}
              </span>
            </div>

            {/* Main Image */}
            <div className="flex-1 relative w-full h-full flex items-center justify-center p-4">
              <div className="relative w-full h-full">
                <Image
                  src={images[selectedIndex].url}
                  alt={`Enlarged property photo ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {/* Navigation Controls */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
