'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ExternalLink, ChevronDown, ChevronUp, Eye,
  Trash2, MapPin, ImageIcon, Home, Wifi, Wind, UtensilsCrossed,
  Droplets, BedSingle, Calendar, User, Mail, Shield, Search, Ban, ArrowUpDown, SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'

type SortKey = 'newest' | 'oldest' | 'rent_asc' | 'rent_desc' | 'views_desc'

const ROOM_TYPES = ['SINGLE', '1BHK', '2BHK', '3BHK', 'PG', 'SHARED']
const ROOM_LABELS: Record<string, string> = {
  SINGLE: 'Single Room', '1BHK': '1 BHK', '2BHK': '2 BHK', '3BHK': '3 BHK', PG: 'PG / Hostel', SHARED: 'Shared',
}

export function ListingsClient({ initialListings }: { initialListings: any[] }) {
  const [listings, setListings] = useState(initialListings)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [removeDialog, setRemoveDialog] = useState<{ id: string; title: string; posterName: string; posterId: string } | null>(null)
  const [removeReason, setRemoveReason] = useState('')

  // ── Search / Filter / Sort state ──────────────────────────────
  const [search, setSearch] = useState('')
  const [roomType, setRoomType] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')
  const [sort, setSort] = useState<SortKey>('newest')

  const supabase = createClient()

  const getHost = (l: any) => l['profiles!listings_poster_id_fkey'] || l.profiles || {}
  const getPrimaryImage = (l: any) => {
    const imgs = l.listing_images || []
    return imgs.find((img: any) => img.is_primary)?.url || imgs[0]?.url || null
  }
  const getPublicImageUrl = (path: string) => path || '/placeholder-listing.png'

  // ── Filtered + sorted list ────────────────────────────────────
  const filtered = useMemo(() => {
    let list = listings

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(l => {
        const host = getHost(l)
        return (l.title || '').toLowerCase().includes(q) ||
          (host.name || '').toLowerCase().includes(q) ||
          (host.email || '').toLowerCase().includes(q) ||
          (l.address || '').toLowerCase().includes(q)
      })
    }
    if (roomType !== 'ALL') list = list.filter(l => l.room_type === roomType)
    if (genderFilter !== 'ALL') list = list.filter(l => l.gender_allowed === genderFilter)

    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'rent_asc') return (a.rent || 0) - (b.rent || 0)
      if (sort === 'rent_desc') return (b.rent || 0) - (a.rent || 0)
      if (sort === 'views_desc') return (b.views || 0) - (a.views || 0)
      return 0
    })
    return list
  }, [listings, search, roomType, genderFilter, sort])

  const hasActiveFilter = search || roomType !== 'ALL' || genderFilter !== 'ALL'

  const handleRemove = async () => {
    if (!removeDialog) return
    setLoadingId(removeDialog.id)
    try {
      const res = await fetch('/api/admin/remove-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: removeDialog.id, reason: removeReason.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setListings(prev => prev.filter(l => l.id !== removeDialog.id))
      if (expandedId === removeDialog.id) setExpandedId(null)
      toast.success('Listing removed. User has been notified.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove listing')
    } finally {
      setLoadingId(null); setRemoveDialog(null); setRemoveReason('')
    }
  }

  if (initialListings.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted-bg flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-text-muted" />
        </div>
        <h2 className="text-xl font-bold text-navy mb-1">No Listings Found</h2>
        <p className="text-text-muted">There are no listings in the database yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Search + Filters bar ──────────────────────────────── */}
      <div className="bg-white border border-border-light rounded-2xl p-3 space-y-3 shadow-sm">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by title, host name, email or address…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted-bg border-0 focus-visible:ring-1"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Room type */}
          <Select value={roomType} onValueChange={v => setRoomType(v)}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <Home className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Room Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {ROOM_TYPES.map(rt => <SelectItem key={rt} value={rt}>{ROOM_LABELS[rt]}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* Gender */}
          <Select value={genderFilter} onValueChange={v => setGenderFilter(v)}>
            <SelectTrigger className="h-9 w-[110px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <User className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="MALE">Boys only</SelectItem>
              <SelectItem value="FEMALE">Girls only</SelectItem>
              <SelectItem value="ANY">Co-ed</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="rent_asc">Rent: low → high</SelectItem>
              <SelectItem value="rent_desc">Rent: high → low</SelectItem>
              <SelectItem value="views_desc">Most views</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilter && (
            <button
              onClick={() => { setSearch(''); setRoomType('ALL'); setGenderFilter('ALL') }}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-coral hover:bg-coral/5 transition-colors border border-coral/20"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto self-center text-xs font-semibold text-text-muted whitespace-nowrap">
            {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border-light p-12 text-center text-text-muted text-sm">
          <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-30" />
          No listings match your filters.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(l => {
            const host = getHost(l)
            const isExpanded = expandedId === l.id
            const primaryImg = getPrimaryImage(l)
            const isLoading = loadingId === l.id
            const allImages = l.listing_images || []

            return (
              <div key={l.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden transition-all duration-300 ${!l.is_active ? 'opacity-70 border-border-light' : 'border-border-light'}`}>

                {/* Summary Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : l.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted-bg/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted-bg shrink-0">
                    {primaryImg ? (
                      <img src={getPublicImageUrl(primaryImg)} alt={l.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-text-muted" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-navy truncate">{l.title}</h3>
                    <p className="text-sm text-text-muted truncate">{host.name || 'Unknown host'} · {host.email || ''}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-base font-black text-navy">₹{l.rent?.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] font-semibold text-text-muted bg-muted-bg px-2 py-0.5 rounded-full">{ROOM_LABELS[l.room_type] ?? l.room_type}</span>
                      {!l.is_active && (
                        <span className="text-[10px] font-bold bg-danger/10 text-danger px-2 py-0.5 rounded-full">Removed</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {!l.is_active && <Ban className="w-4 h-4 text-danger" />}
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                  </div>
                </button>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="border-t border-border-light bg-muted-bg/30 p-5 sm:p-6 space-y-5">
                    {/* Image Gallery */}
                    {allImages.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Images ({allImages.length})
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                          {allImages.map((img: any, i: number) => (
                            <div key={i} className={`relative w-32 h-24 rounded-xl overflow-hidden shrink-0 bg-muted-bg border-2 ${img.is_primary ? 'border-coral' : 'border-border-light'}`}>
                              <img src={getPublicImageUrl(img.url)} alt={`Image ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                              {img.is_primary && (
                                <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-coral text-white px-1.5 py-0.5 rounded-full">Primary</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      <DetailItem icon={<Home className="w-3.5 h-3.5" />} label="Room Type" value={ROOM_LABELS[l.room_type] ?? l.room_type} />
                      <DetailItem icon={<BedSingle className="w-3.5 h-3.5" />} label="Furnishing" value={l.furnished} />
                      <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Gender" value={l.gender_allowed === 'ANY' ? 'Co-ed' : l.gender_allowed === 'MALE' ? 'Boys' : 'Girls'} />
                      <DetailItem icon={<User className="w-3.5 h-3.5" />} label="Roommates" value={l.roommates_needed} />
                      <DetailItem icon={<Droplets className="w-3.5 h-3.5" />} label="Water" value={l.water_supply === '24H' ? '24/7' : l.water_supply === 'TIMED' ? 'Timed' : 'Borewell'} />
                      <DetailItem icon={<Calendar className="w-3.5 h-3.5" />} label="Available" value={l.available_from ? new Date(l.available_from).toLocaleDateString('en-IN') : 'Immediate'} />
                      <DetailItem icon={<MapPin className="w-3.5 h-3.5" />} label="Distance" value={l.distance_from_college != null ? `${l.distance_from_college.toFixed(1)} km` : 'N/A'} />
                      <DetailItem icon={<Eye className="w-3.5 h-3.5" />} label="Views" value={l.views || 0} />
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: l.has_wifi, icon: <Wifi className="w-3.5 h-3.5" />, label: 'WiFi' },
                        { key: l.has_ac, icon: <Wind className="w-3.5 h-3.5" />, label: 'AC' },
                        { key: l.food_available, icon: <UtensilsCrossed className="w-3.5 h-3.5" />, label: 'Food' },
                      ].map(a => (
                        <span key={a.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${a.key ? 'bg-success/10 text-success' : 'bg-muted-bg text-text-muted line-through'}`}>
                          {a.icon} {a.label}
                        </span>
                      ))}
                    </div>

                    {/* Description */}
                    {l.description && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Description</span>
                        <p className="text-sm text-text-primary leading-relaxed">{l.description}</p>
                      </div>
                    )}

                    {/* Address */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Address
                      </span>
                      <p className="text-sm text-text-primary">{l.address}</p>
                      <p className="text-xs text-text-muted">Lat: {l.latitude?.toFixed(4)}, Lng: {l.longitude?.toFixed(4)}</p>
                    </div>

                    {/* Host Info */}
                    <div className="bg-white rounded-2xl border border-border-light p-4">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide flex items-center gap-1 mb-2">
                        <User className="w-3 h-3" /> Host
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {host.avatar_url ? (
                            <img src={host.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-navy">{(host.name || '?')[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-navy text-sm">{host.name || 'Unknown'}</p>
                          <p className="text-xs text-text-muted flex items-center gap-1"><Mail className="w-3 h-3" /> {host.email}</p>
                        </div>
                        {host.verified_status === 'VERIFIED' && <Shield className="w-5 h-5 text-success ml-auto" />}
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="flex gap-4 text-xs text-text-muted">
                      <span>Created: {new Date(l.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                      <span>Updated: {new Date(l.updated_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-light">
                      <Link href={`/listings/${l.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="h-9 rounded-xl font-medium">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View on Site
                        </Button>
                      </Link>
                      <Button
                        variant="destructive" size="sm"
                        className="h-9 rounded-xl font-medium ml-auto"
                        disabled={isLoading}
                        onClick={() => setRemoveDialog({ id: l.id, title: l.title, posterName: host.name || 'Unknown', posterId: l.poster_id })}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removeDialog} onOpenChange={(open) => { if (!open) { setRemoveDialog(null); setRemoveReason('') } }}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-danger" /> Remove Listing
            </DialogTitle>
            <DialogDescription>
              This will remove <strong>&ldquo;{removeDialog?.title}&rdquo;</strong> from the website for all users and notify <strong>{removeDialog?.posterName}</strong>. The listing will appear in the Removed Listings page where it can be restored.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for removal (shown to the listing owner)..."
              value={removeReason}
              onChange={e => setRemoveReason(e.target.value)}
              className="min-h-[100px] rounded-2xl resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {['Violates community guidelines', 'Duplicate listing', 'Scam or fake listing', 'Inappropriate content', 'Owner requested removal'].map(q => (
                <button key={q} type="button" onClick={() => setRemoveReason(q)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border-light hover:border-danger/40 hover:bg-danger/[0.04] text-text-muted hover:text-danger transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRemoveDialog(null); setRemoveReason('') }} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleRemove} className="rounded-xl shadow-md shadow-danger/20" disabled={loadingId === removeDialog?.id}>
              {loadingId === removeDialog?.id ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Remove Listing</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide flex items-center gap-1">
        {icon} {label}
      </span>
      <p className="text-sm font-semibold text-navy">{value ?? '—'}</p>
    </div>
  )
}
