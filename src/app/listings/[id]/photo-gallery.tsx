'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Grid2X2, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom if pressing ctrl/cmd or if we want to allow scrolling to zoom always
    // Let's allow scrolling to zoom always for convenience in photo viewer
    const delta = e.deltaY * -0.005
    const newScale = Math.min(Math.max(1, scale + delta), 5) // max zoom 5x
    setScale(newScale)
    if (newScale === 1) setPosition({ x: 0, y: 0 })
  }

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    } else {
      setScale(2)
    }
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden touch-none flex items-center justify-center"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="relative w-full h-full"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
        }}
      >
        <Image 
          src={src} 
          alt={alt} 
          fill 
          className="object-contain" 
          sizes="100vw" 
          priority 
          draggable={false} 
        />
      </div>
    </div>
  )
}

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
          <Button variant="secondary" className="absolute bottom-6 right-6 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm hover:bg-white text-navy font-semibold shadow-xl rounded-full px-5 py-6">
            <Grid2X2 className="w-5 h-5" />
            Show all photos
          </Button>
        }
      >
        <Grid2X2 className="w-5 h-5" />
        Show all photos
      </DialogTrigger>
      
      {/* Immersive Full Screen Dialog */}
      <DialogContent 
        className="max-w-none w-screen h-screen !rounded-none p-0 bg-black/98 border-none text-white flex flex-col [&>button]:text-white/70 [&>button:hover]:text-white [&>button]:top-6 [&>button]:right-6 [&>button]:z-50 [&>button>svg]:w-6 [&>button>svg]:h-6"
        showCloseButton={selectedIndex === null}
      >
        <DialogTitle className="sr-only">Property Photos Gallery</DialogTitle>
        
        {selectedIndex === null ? (
          // --- GRID VIEW ---
          <div className="flex-1 overflow-y-auto pb-12 w-full max-w-7xl mx-auto px-4 sm:px-8">
            <div className="sticky top-0 z-20 bg-black/98 py-6 mb-4 flex items-center justify-between border-b border-white/10">
              <h2 className="text-xl font-medium tracking-wide">All Photos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img, i) => (
                <button
                  key={i} 
                  className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-white/5 cursor-pointer group"
                  onClick={() => setSelectedIndex(i)}
                >
                  <Image
                    src={img.url}
                    alt={`Property photo ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          // --- ENLARGED VIEW ---
          <div className="flex-1 flex flex-col relative w-full h-full bg-black">
            
            {/* Top Bar Navigation */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
              <button 
                onClick={() => setSelectedIndex(null)}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
                <span className="text-sm font-medium tracking-wide uppercase">Back to grid</span>
              </button>
              <span className="text-sm font-medium text-white/70 tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                {selectedIndex + 1} / {images.length}
              </span>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 relative w-full h-full flex items-center justify-center select-none overflow-hidden">
              <ZoomableImage 
                src={images[selectedIndex].url} 
                alt={`Enlarged property photo ${selectedIndex + 1}`} 
              />

              {/* Elegant Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-all transform hover:scale-110 focus:outline-none z-40 bg-black/20 rounded-full backdrop-blur-sm"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-8 h-8 sm:w-12 sm:h-12 drop-shadow-xl" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-all transform hover:scale-110 focus:outline-none z-40 bg-black/20 rounded-full backdrop-blur-sm"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-8 h-8 sm:w-12 sm:h-12 drop-shadow-xl" strokeWidth={1.5} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
