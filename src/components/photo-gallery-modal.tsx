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
const ZOOM_STEP = 0.5

export function PhotoGalleryModal({ photos, initialIndex = 0, onClose }: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [isGridView, setIsGridView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Refs for all mutable values — DOM listeners are non-reactive closures,
  // so they MUST read from refs (never state) to avoid stale values.
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const touchStart = useRef<{ x: number; y: number; dist: number } | null>(null)
  const zoomAtTouchStart = useRef(1)
  const panAtTouchStart = useRef({ x: 0, y: 0 })
  const lastTap = useRef(0)
  // Mouse pan refs
  const mouseDownPos = useRef({ x: 0, y: 0 })
  const panAtMouseDown = useRef({ x: 0, y: 0 })

  // Keep refs in sync with state on every render
  zoomRef.current = zoom
  panRef.current = pan

  // ── Clamp pan so image never slides off-screen ─────────────
  const clampPan = useCallback((x: number, y: number, z: number) => {
    if (!containerRef.current) return { x, y }
    const rect = containerRef.current.getBoundingClientRect()
    const maxX = (rect.width  * (z - 1)) / 2
    const maxY = (rect.height * (z - 1)) / 2
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

  // ── Keyboard navigation ────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && zoomRef.current <= 1) {
        setCurrentIndex(i => (i + 1) % photos.length)
        resetView()
      }
      if (e.key === 'ArrowLeft' && zoomRef.current <= 1) {
        setCurrentIndex(i => (i - 1 + photos.length) % photos.length)
        resetView()
      }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))
      if (e.key === '-') setZoom(z => {
        const n = Math.max(MIN_ZOOM, z - ZOOM_STEP)
        if (n === 1) setPan({ x: 0, y: 0 })
        return n
      })
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, photos.length, resetView])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── Non-passive touch listeners ────────────────────────────
  // React's synthetic touch events are passive by default — calling
  // e.preventDefault() inside them is silently ignored and the browser
  // still fires its native pinch-zoom. We use real DOM listeners with
  // { passive: false } to actually suppress native gestures.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single finger — record start position AND current pan from ref (not stale state)
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          dist: 0,
        }
        // Critical fix: read panRef, NOT a closure over `pan` state (which would be stale)
        panAtTouchStart.current = { x: panRef.current.x, y: panRef.current.y }
      } else if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        touchStart.current = { x: 0, y: 0, dist: Math.hypot(dx, dy) }
        // Snapshot current zoom & pan at the moment fingers touch down
        zoomAtTouchStart.current = zoomRef.current
        panAtTouchStart.current = { x: panRef.current.x, y: panRef.current.y }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return
      e.preventDefault() // blocks native scroll AND pinch-zoom

      if (e.touches.length === 2 && touchStart.current.dist > 0) {
        // ── Pinch zoom ──────────────────────────────────────
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const newDist = Math.hypot(dx, dy)
        const scale = newDist / touchStart.current.dist
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomAtTouchStart.current * scale))
        setZoom(newZoom)
        if (newZoom <= 1) setPan({ x: 0, y: 0 })
        return
      }

      if (e.touches.length === 1) {
        // ── Single-finger pan (only when zoomed in) ─────────
        const dx = e.touches[0].clientX - touchStart.current.x
        const dy = e.touches[0].clientY - touchStart.current.y
        if (zoomRef.current > 1) {
          // Add delta to the pan value that was snapshot at touchstart
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

      // Double-tap to toggle zoom
      if (now - lastTap.current < 300) {
        if (zoomRef.current > 1) {
          setZoom(1); setPan({ x: 0, y: 0 })
        } else {
          setZoom(2.5)
        }
        lastTap.current = 0
      } else {
        lastTap.current = now
        // Swipe left/right to navigate (only when not zoomed)
        if (zoomRef.current <= 1 && Math.abs(dx) > 50) {
          const dir = dx > 0 ? -1 : 1
          setCurrentIndex(i => (i + dir + photos.length) % photos.length)
          setZoom(1); setPan({ x: 0, y: 0 }); setIsLoaded(false)
        }
      }
      touchStart.current = null
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false })
    el.addEventListener('touchmove',  handleTouchMove,  { passive: false })
    el.addEventListener('touchend',   handleTouchEnd,   { passive: false })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove',  handleTouchMove)
      el.removeEventListener('touchend',   handleTouchEnd)
    }
  }, [clampPan, photos.length])

  // ── Mouse pan ──────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return
    e.preventDefault()
    setIsPanning(true)
    mouseDownPos.current  = { x: e.clientX, y: e.clientY }
    panAtMouseDown.current = { x: panRef.current.x, y: panRef.current.y }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const clamped = clampPan(
      panAtMouseDown.current.x + (e.clientX - mouseDownPos.current.x),
      panAtMouseDown.current.y + (e.clientY - mouseDownPos.current.y),
      zoom,
    )
    setPan(clamped)
  }
  const onMouseUp = () => setIsPanning(false)

  // ── Scroll-wheel zoom ──────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP)))
      if (next === 1) setPan({ x: 0, y: 0 })
      return next
    })
  }

  const currentPhoto = photos[currentIndex]

  // ── Grid / thumbnail overview ──────────────────────────────
  if (isGridView) {
    return (
      // Backdrop
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-fade-in"
        style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        {/* Popup card */}
        <div
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
          style={{ background: '#1E3A5F', border: '1px solid rgba(255,255,255,0.12)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
          >
            <button
              onClick={() => setIsGridView(false)}
              className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              <Maximize2 className="w-4 h-4" />
              <span>Back to viewer</span>
            </button>
            <span className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(232,89,60,0.2)', color: '#E8593C', border: '1px solid rgba(232,89,60,0.3)' }}>
              {photos.length} photos
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setIsGridView(false); resetView() }}
                  className="relative aspect-square rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.03] focus:outline-none"
                  style={{
                    outline: i === currentIndex ? '2px solid #E8593C' : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  <Image
                    src={photo.url}
                    alt={`Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {/* Active overlay */}
                  {i === currentIndex && (
                    <div className="absolute inset-0 flex items-end justify-end p-1.5"
                      style={{ background: 'rgba(232,89,60,0.15)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#E8593C' }}>
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Index badge */}
                  <div
                    className="absolute top-1.5 left-1.5 text-white text-xs px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ background: 'rgba(30,58,95,0.75)', backdropFilter: 'blur(4px)' }}
                  >
                    {i + 1}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main viewer popup ──────────────────────────────────────
  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10 animate-fade-in"
      style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
      onMouseUp={onMouseUp}
    >
      {/* ── Popup card ──────────────────────────────────── */}
      <div
        className="relative w-full max-w-4xl flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{
          background: '#1E3A5F',
          border: '1px solid rgba(255,255,255,0.12)',
          maxHeight: 'min(90vh, 700px)',
          // Stop click events from bubbling to backdrop
        }}
        onClick={e => e.stopPropagation()}
        onMouseLeave={onMouseUp}
      >
        {/* ── TOP BAR ─────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-2.5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)' }}
        >
          {/* Counter + badge */}
          <div className="flex items-center gap-2.5">
            <span className="text-white font-bold text-sm">{currentIndex + 1}</span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{photos.length}</span>
            {photos[currentIndex]?.is_primary && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(232,89,60,0.2)', color: '#E8593C', border: '1px solid rgba(232,89,60,0.3)' }}
              >
                Primary
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            {/* Zoom out */}
            <button
              onClick={() => setZoom(z => { const n = Math.max(MIN_ZOOM, z - ZOOM_STEP); if (n === 1) setPan({ x: 0, y: 0 }); return n })}
              disabled={zoom <= MIN_ZOOM}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Zoom % */}
            <span
              className="text-xs font-mono w-10 text-center hidden sm:block"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {Math.round(zoom * 100)}%
            </span>

            {/* Zoom in */}
            <button
              onClick={() => setZoom(z => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Reset */}
            {zoom > 1 && (
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(232,89,60,0.25)', color: '#E8593C' }}
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Grid view */}
            <button
              onClick={() => setIsGridView(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              aria-label="All photos"
            >
              <Grid3x3 className="w-3.5 h-3.5" />
            </button>

            {/* Divider */}
            <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── IMAGE AREA ──────────────────────────────── */}
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden"
          style={{
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            touchAction: 'none',   // block ALL native touch gestures on this element
            minHeight: 0,          // allow flex-shrink to work
            background: 'rgba(0,0,0,0.4)',
          }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
        >
          {/* Spinner */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: '#E8593C' }}
              />
            </div>
          )}

          {/* Image */}
          <div
            className="w-full h-full"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              // Only add transition when NOT actively panning (avoids lag)
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
              willChange: 'transform',
            }}
          >
            <Image
              key={currentPhoto.url}
              src={currentPhoto.url}
              alt={`Photo ${currentIndex + 1}`}
              fill
              className={`object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              onLoad={() => setIsLoaded(true)}
              draggable={false}
            />
          </div>

          {/* Left arrow */}
          {photos.length > 1 && zoom <= 1 && (
            <button
              onClick={() => { setCurrentIndex(i => (i - 1 + photos.length) % photos.length); resetView() }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              style={{ background: 'rgba(30,58,95,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(4px)' }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Right arrow */}
          {photos.length > 1 && zoom <= 1 && (
            <button
              onClick={() => { setCurrentIndex(i => (i + 1) % photos.length); resetView() }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 z-10"
              style={{ background: 'rgba(30,58,95,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(4px)' }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Zoom hint */}
          {isLoaded && zoom === 1 && (
            <div
              className="absolute bottom-2 right-3 text-xs pointer-events-none hidden sm:block"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              scroll / pinch to zoom · double-tap
            </div>
          )}
        </div>

        {/* ── FILMSTRIP ───────────────────────────────── */}
        {photos.length > 1 && (
          <div
            className="shrink-0 px-3 py-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
          >
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 justify-start sm:justify-center"
              style={{ scrollbarWidth: 'none' }}>
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); resetView() }}
                  className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden transition-all duration-200 focus:outline-none hover:scale-105"
                  style={{
                    border: i === currentIndex
                      ? '2px solid #E8593C'
                      : '2px solid rgba(255,255,255,0.15)',
                    opacity: i === currentIndex ? 1 : 0.55,
                    boxShadow: i === currentIndex ? '0 0 0 1px rgba(232,89,60,0.3)' : 'none',
                  }}
                  aria-label={`Go to photo ${i + 1}`}
                >
                  <Image
                    src={photo.url}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
