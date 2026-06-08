'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Grid3x3, Maximize2 } from 'lucide-react'

interface Photo {
  url: string
  order?: number
  is_primary?: boolean
}

interface PhotoGalleryModalProps {
  photos: Photo[]
  initialIndex?: number
  onClose: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.6

export function PhotoGalleryModal({ photos, initialIndex = 0, onClose }: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isGridView, setIsGridView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  const panStart = useRef({ x: 0, y: 0 })
  const panOrigin = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null)
  const zoomAtTouchStart = useRef(1)
  const panAtTouchStart = useRef({ x: 0, y: 0 })
  // Refs that mirror state so DOM event listeners (non-reactive closures) can read current values
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })

  // Keep refs in sync with state
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { panRef.current = pan }, [pan])

  // ── helpers ───────────────────────────────────────────────
  const clampPan = useCallback((x: number, y: number, currentZoom: number) => {
    if (!containerRef.current) return { x, y }
    const rect = containerRef.current.getBoundingClientRect()
    const maxX = (rect.width * (currentZoom - 1)) / 2
    const maxY = (rect.height * (currentZoom - 1)) / 2
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    }
  }, [])

  const resetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setIsLoaded(false)
  }, [])

  const navigate = useCallback((dir: 1 | -1) => {
    if (zoom > 1) return // don't nav while zoomed
    setCurrentIndex((i) => (i + dir + photos.length) % photos.length)
    resetView()
  }, [zoom, photos.length, resetView])

  const handleZoomIn = () => {
    setZoom(z => {
      const next = Math.min(MAX_ZOOM, z + ZOOM_STEP)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const handleZoomOut = () => {
    setZoom(z => {
      const next = Math.max(MIN_ZOOM, z - ZOOM_STEP)
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  // ── keyboard navigation ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft') navigate(-1)
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === 'g' || e.key === 'G') setIsGridView(v => !v)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, onClose])

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── Non-passive touch listeners (required to call preventDefault on pinch) ──
  // React registers synthetic touch events as *passive*, meaning e.preventDefault()
  // is silently ignored and the browser still fires its native pinch-zoom.
  // We attach real DOM listeners with { passive: false } to intercept them first.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 }
        panAtTouchStart.current = { x: pan.x, y: pan.y }
      } else if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        touchStart.current = { x: 0, y: 0, dist }
        zoomAtTouchStart.current = zoomRef.current
        panAtTouchStart.current = { x: panRef.current.x, y: panRef.current.y }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return
      // Always prevent default to block native browser pinch-zoom and scroll
      e.preventDefault()

      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const scale = dist / touchStart.current.dist
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomAtTouchStart.current * scale))
        setZoom(newZoom)
        if (newZoom <= 1) setPan({ x: 0, y: 0 })
        return
      }

      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchStart.current.x
        const dy = e.touches[0].clientY - touchStart.current.y
        if (zoomRef.current > 1) {
          const clamped = clampPan(
            panAtTouchStart.current.x + dx,
            panAtTouchStart.current.y + dy,
            zoomRef.current,
          )
          setPan(clamped)
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current || e.touches.length > 0) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const now = Date.now()

      // Double-tap to zoom
      if (now - lastTap.current < 300) {
        if (zoomRef.current > 1) {
          setZoom(1)
          setPan({ x: 0, y: 0 })
        } else {
          setZoom(2.5)
        }
        lastTap.current = 0 // reset so triple-tap doesn't double-fire
      } else {
        lastTap.current = now
        // Swipe navigation (only when not zoomed)
        if (zoomRef.current <= 1 && Math.abs(dx) > 50) {
          setCurrentIndex((i) => {
            const next = (i + (dx > 0 ? -1 : 1) + photos.length) % photos.length
            return next
          })
          setZoom(1)
          setPan({ x: 0, y: 0 })
          setIsLoaded(false)
        }
      }
      touchStart.current = null
    }

    // { passive: false } is the critical flag — without it, preventDefault() is a no-op
    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampPan, photos.length])

  // ── mouse pan ─────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    panOrigin.current = { ...pan }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.current.x
    const dy = e.clientY - panStart.current.y
    const clamped = clampPan(panOrigin.current.x + dx, panOrigin.current.y + dy, zoom)
    setPan(clamped)
  }

  const onMouseUp = () => setIsPanning(false)

  // ── scroll wheel zoom ─────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom(z => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  // Touch gestures are handled via non-passive DOM listeners in the useEffect above.
  // (React synthetic touch events are passive and cannot call preventDefault)
  const lastTap = useRef(0)

  const currentPhoto = photos[currentIndex]

  // ── grid view ─────────────────────────────────────────────
  if (isGridView) {
    return (
      <div className="fixed inset-0 z-50 bg-black/97 flex flex-col animate-fade-in">
        {/* Grid Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsGridView(false)}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Back to viewer</span>
            </button>
          </div>
          <span className="text-white/50 text-sm font-medium">{photos.length} photos</span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); setIsGridView(false); resetView() }}
                className={`relative aspect-square rounded-xl overflow-hidden ring-2 transition-all duration-200 hover:scale-[1.02] focus:outline-none ${
                  i === currentIndex
                    ? 'ring-[#E8593C] scale-[1.02]'
                    : 'ring-transparent hover:ring-white/30'
                }`}
              >
                <Image
                  src={photo.url}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                {i === currentIndex && (
                  <div className="absolute inset-0 bg-[#E8593C]/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-[#E8593C] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-md font-medium backdrop-blur-sm">
                  {i + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── main viewer ───────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 bg-black/97 flex flex-col select-none animate-fade-in"
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* ── TOP BAR ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 shrink-0 border-b border-white/10">
        {/* Counter */}
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm sm:text-base">
            {currentIndex + 1}
          </span>
          <span className="text-white/40 text-sm">/</span>
          <span className="text-white/50 text-sm">{photos.length}</span>
          {photos[currentIndex]?.is_primary && (
            <span className="ml-2 px-2 py-0.5 bg-[#E8593C]/20 text-[#E8593C] text-xs font-semibold rounded-full border border-[#E8593C]/30">
              Primary
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom out */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom label */}
          <span className="text-white/70 text-xs font-mono w-10 text-center hidden sm:block">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom in */}
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Reset zoom */}
          {zoom > 1 && (
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Grid view */}
          <button
            onClick={() => setIsGridView(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Grid view"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-white/20 mx-1 hidden sm:block" />

          {/* Close */}
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── IMAGE AREA ──────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        style={{
          cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
          // Disable ALL native touch handling on this element.
          // This prevents iOS/Android from intercepting pinch-to-zoom or scroll
          // before our non-passive listener gets a chance to call preventDefault().
          touchAction: 'none',
        }}
      >
        {/* Loading shimmer */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </div>
        )}

        {/* Main image */}
        <div
          className="w-full h-full transition-transform duration-75"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          <Image
            key={currentPhoto.url}
            src={currentPhoto.url}
            alt={`Photo ${currentIndex + 1}`}
            fill
            className={`object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            priority
            sizes="100vw"
            onLoad={(e) => {
              setIsLoaded(true)
              const img = e.currentTarget
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
            }}
            draggable={false}
          />
        </div>

        {/* ── Left arrow ─────────────────────────────────── */}
        {photos.length > 1 && zoom <= 1 && (
          <button
            onClick={() => navigate(-1)}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-105 border border-white/10 z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* ── Right arrow ────────────────────────────────── */}
        {photos.length > 1 && zoom <= 1 && (
          <button
            onClick={() => navigate(1)}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-sm text-white flex items-center justify-center transition-all duration-200 hover:scale-105 border border-white/10 z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Image resolution hint */}
        {isLoaded && imgSize.w > 0 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs font-mono pointer-events-none hidden sm:block">
            {imgSize.w} × {imgSize.h}
          </div>
        )}

        {/* Zoom hint overlay (shows once) */}
        {isLoaded && zoom === 1 && (
          <div className="absolute bottom-4 right-4 text-white/30 text-xs pointer-events-none hidden sm:flex items-center gap-1">
            <span>Scroll to zoom</span>
          </div>
        )}
      </div>

      {/* ── FILMSTRIP THUMBNAILS ─────────────────────────── */}
      {photos.length > 1 && (
        <div className="shrink-0 px-3 py-2.5 border-t border-white/10 bg-black/60 backdrop-blur-sm">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide justify-start sm:justify-center">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => { setCurrentIndex(i); resetView() }}
                className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 focus:outline-none ${
                  i === currentIndex
                    ? 'border-[#E8593C] scale-105 shadow-lg shadow-[#E8593C]/30'
                    : 'border-white/20 hover:border-white/50 opacity-60 hover:opacity-100'
                }`}
                aria-label={`Go to photo ${i + 1}`}
                aria-pressed={i === currentIndex}
              >
                <Image
                  src={photo.url}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
