'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Ban, Check, ExternalLink, Clock, RotateCcw,
  Eye, X, ChevronRight, Home, Mail, Shield,
  ImageIcon, AlertTriangle, UserCircle2, ChevronDown, ChevronUp,
} from 'lucide-react'

// ── Display helpers ───────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  OPEN:      'bg-danger/10 text-danger',
  REVIEWING: 'bg-amber-100 text-amber-700',
  RESOLVED:  'bg-success/10 text-success',
  DISMISSED: 'bg-muted-bg text-text-muted',
}
const REASON_LABELS: Record<string, string> = {
  FAKE_LISTING: 'Fake Listing', SCAM: 'Scam / Fraud',
  HARASSMENT: 'Harassment', SPAM: 'Spam',
  DISCRIMINATION: 'Discrimination', OTHER: 'Other',
}
const FLAT_LABELS: Record<string, string> = {
  SINGLE: 'Single Room', '1BHK': '1 BHK', '2BHK': '2 BHK',
  '3BHK': '3 BHK', PG: 'PG / Hostel', SHARED: 'Shared',
}

export function ReportsClient({ initialReports }: { initialReports: any[] }) {
  const [reports, setReports] = useState(initialReports)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'>('OPEN')
  const [detailsPanel, setDetailsPanel] = useState<{ report: any; data: any } | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // ── API helpers ───────────────────────────────────────────────
  const updateStatus = async (reportId: string, status: string) => {
    setLoadingId(reportId)
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    })
    if (!res.ok) toast.error('Failed to update report')
    else {
      setReports((p: any[]) => p.map(r => r.id === reportId ? { ...r, status } : r))
      toast.success(`Report marked as ${status}`)
    }
    setLoadingId(null)
  }

  const handleRemoveListing = async (listingId: string, reportId: string) => {
    if (!confirm('Remove this listing? It will be hidden from all users.')) return
    setLoadingId(reportId)
    const res = await fetch('/api/admin/remove-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, reason: 'Removed due to user report' }),
    })
    if (!res.ok) { toast.error('Failed to remove listing'); setLoadingId(null); return }
    toast.success('Listing removed & owner notified')
    setReports((p: any[]) => p.map(r => r.id === reportId ? { ...r, listing_is_active: false } : r))
    await updateStatus(reportId, 'RESOLVED')
    setLoadingId(null)
  }

  const handleRestoreListing = async (listingId: string, reportId: string) => {
    if (!confirm('Restore this listing? It will become visible again.')) return
    setLoadingId(reportId)
    const res = await fetch('/api/admin/restore-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    })
    if (!res.ok) { toast.error('Failed to restore listing'); setLoadingId(null); return }
    toast.success('Listing restored & owner notified')
    setReports((p: any[]) => p.map(r => r.id === reportId ? { ...r, listing_is_active: true } : r))
    await updateStatus(reportId, 'DISMISSED')
    setLoadingId(null)
  }

  const handleSuspend = async (userId: string, reportId: string) => {
    if (!confirm('Suspend this user? They will be locked out and notified.')) return
    setLoadingId(reportId)
    const res = await fetch('/api/admin/suspend-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (!res.ok) { toast.error('Failed to suspend user'); setLoadingId(null); return }
    toast.success('User suspended')
    await updateStatus(reportId, 'RESOLVED')
    setLoadingId(null)
  }

  const openDetails = async (report: any) => {
    setDetailsLoading(true)
    setDetailsPanel({ report, data: null })
    try {
      const res = await fetch(
        `/api/admin/report-details?type=${report.target_type}&id=${report.target_id}`
      )
      const data = await res.json()
      setDetailsPanel({ report, data })
    } catch {
      toast.error('Failed to load details')
      setDetailsPanel(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  const handleReopen = async (report: any) => {
    setLoadingId(report.id)
    if (report.target_type === 'USER' && report.status === 'RESOLVED') {
      try {
        await fetch('/api/admin/unsuspend-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: report.target_id }),
        })
        toast.success('User unsuspended')
      } catch { /* non-fatal */ }
    }
    await updateStatus(report.id, 'OPEN')
    setLoadingId(null)
  }

  // ── Filter counts ─────────────────────────────────────────────
  const counts = {
    ALL: reports.length,
    OPEN: reports.filter((r: any) => r.status === 'OPEN').length,
    REVIEWING: reports.filter((r: any) => r.status === 'REVIEWING').length,
    RESOLVED: reports.filter((r: any) => r.status === 'RESOLVED').length,
    DISMISSED: reports.filter((r: any) => r.status === 'DISMISSED').length,
  }
  const filtered = filter === 'ALL' ? reports : reports.filter((r: any) => r.status === filter)

  // ── Shared action buttons ─────────────────────────────────────
  const ActionButtons = ({ r, compact = false }: { r: any; compact?: boolean }) => {
    const isActive = r.status === 'OPEN' || r.status === 'REVIEWING'
    const listingRemoved = r.target_type === 'LISTING' && r.listing_is_active === false
    const cls = compact ? 'text-xs h-8' : 'text-sm h-9'

    return (
      <div className={`flex ${compact ? 'flex-col gap-1' : 'flex-wrap gap-2'}`}>
        <Button variant="outline" size="sm" onClick={() => openDetails(r)}
          className={`${cls} border-navy/20 text-navy hover:bg-navy/5 ${compact ? 'w-full justify-start' : ''}`}>
          <Eye className="w-3.5 h-3.5 mr-1.5" /> Details
        </Button>

        {isActive && (
          <>
            {r.status === 'OPEN' && (
              <Button variant="outline" size="sm" disabled={loadingId === r.id}
                onClick={() => updateStatus(r.id, 'REVIEWING')}
                className={`${cls} text-amber-600 border-amber-300 hover:bg-amber-50 ${compact ? 'w-full justify-start' : ''}`}>
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Under Review
              </Button>
            )}
            {r.target_type === 'LISTING' && (
              <Button variant="destructive" size="sm" disabled={loadingId === r.id}
                onClick={() => handleRemoveListing(r.target_id, r.id)}
                className={`${cls} ${compact ? 'w-full justify-start' : ''}`}>
                <Ban className="w-3.5 h-3.5 mr-1.5" /> Block Listing
              </Button>
            )}
            {r.target_type === 'USER' && (
              <Button variant="destructive" size="sm" disabled={loadingId === r.id}
                onClick={() => handleSuspend(r.target_id, r.id)}
                className={`${cls} ${compact ? 'w-full justify-start' : ''}`}>
                <Ban className="w-3.5 h-3.5 mr-1.5" /> Suspend User
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={loadingId === r.id}
              onClick={() => updateStatus(r.id, 'DISMISSED')}
              className={`${cls} text-text-muted ${compact ? 'w-full justify-start' : ''}`}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Dismiss
            </Button>
          </>
        )}

        {r.target_type === 'LISTING' && listingRemoved && (
          <Button variant="outline" size="sm" disabled={loadingId === r.id}
            onClick={() => handleRestoreListing(r.target_id, r.id)}
            className={`${cls} border-success/40 text-success hover:bg-success/5 ${compact ? 'w-full justify-start' : ''}`}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
          </Button>
        )}

        {!isActive && (
          <Button variant="outline" size="sm" disabled={loadingId === r.id}
            onClick={() => handleReopen(r)}
            className={`${cls} text-text-muted hover:text-navy ${compact ? 'w-full justify-start' : ''}`}>
            <RotateCcw className="w-3 h-3 mr-1" /> Reopen
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED', 'ALL'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f ? 'bg-navy text-white shadow-sm' : 'bg-white border border-border-light text-text-muted hover:border-navy/30'
            }`}>
            {f} <span className="ml-1 opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-border-light text-text-muted text-sm">
          No {filter === 'ALL' ? '' : filter.toLowerCase() + ' '}reports found.
        </div>
      )}

      {/* ── Desktop Table ────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="hidden lg:block bg-white rounded-2xl border border-border-light overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-muted-bg/50 border-b border-border-light">
                  <th className="p-4 font-bold text-navy text-sm w-36">Status</th>
                  <th className="p-4 font-bold text-navy text-sm">Reporter</th>
                  <th className="p-4 font-bold text-navy text-sm">Reported</th>
                  <th className="p-4 font-bold text-navy text-sm w-48">Reason</th>
                  <th className="p-4 font-bold text-navy text-sm">Date</th>
                  <th className="p-4 font-bold text-navy text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map((r: any) => {
                  const isActive = r.status === 'OPEN' || r.status === 'REVIEWING'
                  const listingRemoved = r.target_type === 'LISTING' && r.listing_is_active === false
                  return (
                    <tr key={r.id} className={`hover:bg-muted-bg/20 transition-colors ${!isActive ? 'opacity-70' : ''}`}>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status] ?? ''}`}>
                            {r.status}
                          </span>
                          {listingRemoved && (
                            <div className="text-[10px] font-bold text-danger bg-danger/10 px-2 py-0.5 rounded-full w-fit">
                              Listing Removed
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-sm">{r.reporter?.name ?? '—'}</div>
                        <div className="text-xs text-text-muted">{r.reporter?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide w-fit ${
                            r.target_type === 'LISTING' ? 'bg-navy/10 text-navy' : 'bg-coral/10 text-coral'
                          }`}>{r.target_type}</span>
                          {r.target_type === 'LISTING' ? (
                            <a href={`/listings/${r.target_id}`} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-0.5 text-sm font-medium hover:text-coral transition-colors underline underline-offset-2 ${listingRemoved ? 'line-through text-text-muted' : 'text-navy'}`}>
                              {r.target_label} <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <div>
                              <div className="text-sm font-medium">{r.target_label}</div>
                              {r.target_email && <div className="text-xs text-text-muted">{r.target_email}</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-bold">{REASON_LABELS[r.reason] ?? r.reason}</div>
                        {r.description && <div className="text-xs text-text-muted mt-0.5 line-clamp-2">{r.description}</div>}
                      </td>
                      <td className="p-4 text-xs text-text-muted whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5 items-end">
                          <ActionButtons r={r} compact />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Mobile / Tablet Card List ────────────────────── */}
      {filtered.length > 0 && (
        <div className="lg:hidden space-y-3">
          {filtered.map((r: any) => {
            const isActive = r.status === 'OPEN' || r.status === 'REVIEWING'
            const listingRemoved = r.target_type === 'LISTING' && r.listing_is_active === false
            const isExpanded = expandedId === r.id

            return (
              <div key={r.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${!isActive ? 'opacity-80 border-border-light' : 'border-border-light'}`}>
                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted-bg/40 transition-colors"
                >
                  <div className="shrink-0 pt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                        r.target_type === 'LISTING' ? 'bg-navy/10 text-navy' : 'bg-coral/10 text-coral'
                      }`}>{r.target_type}</span>
                      <span className="text-xs font-semibold text-navy truncate">{r.target_label}</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {REASON_LABELS[r.reason] ?? r.reason}
                      {r.description && <span className="ml-1 opacity-70">· {r.description}</span>}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">
                      By {r.reporter?.name ?? '—'} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    {listingRemoved && (
                      <span className="text-[9px] font-bold text-danger bg-danger/10 px-1.5 py-0.5 rounded-full inline-block mt-1">Listing Removed</span>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />}
                </button>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="border-t border-border-light bg-muted-bg/30 p-4">
                    <ActionButtons r={r} compact />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Details Slide-Over Panel ── */}
      {detailsPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={() => setDetailsPanel(null)} />

          {/* Panel — full screen on mobile, 2xl on desktop */}
          <div className="relative w-full sm:max-w-lg lg:max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Panel header */}
            <div className="sticky top-0 bg-white border-b border-border-light px-4 sm:px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                  detailsPanel.report.target_type === 'LISTING' ? 'bg-navy/10 text-navy' : 'bg-coral/10 text-coral'
                }`}>
                  {detailsPanel.report.target_type}
                </div>
                <h2 className="font-bold text-navy text-base">
                  {detailsPanel.report.target_type === 'LISTING' ? 'Listing Details' : 'User Details'}
                </h2>
              </div>
              <button onClick={() => setDetailsPanel(null)}
                className="w-8 h-8 rounded-full bg-muted-bg hover:bg-border flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {/* Loading */}
            {detailsLoading && (
              <div className="flex-1 flex items-center justify-center">
                <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
              </div>
            )}

            {/* Content */}
            {!detailsLoading && detailsPanel.data && (
              <div className="p-4 sm:p-6 space-y-6 flex-1">
                {/* ── LISTING DETAILS ── */}
                {detailsPanel.report.target_type === 'LISTING' && (() => {
                  const { listing, otherListings } = detailsPanel.data
                  const poster = listing['profiles!listings_poster_id_fkey'] || listing.profiles || {}
                  const images = [...(listing.listing_images || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                  return (
                    <>
                      {/* Photos */}
                      {images.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5" /> Photos ({images.length})
                          </h3>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((img: any, i: number) => (
                              <div key={i} className={`relative w-36 h-24 rounded-xl overflow-hidden shrink-0 border-2 ${img.is_primary ? 'border-coral' : 'border-border-light'}`}>
                                <img src={img.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                {img.is_primary && (
                                  <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-coral text-white px-1.5 py-0.5 rounded-full">Cover</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Listing info */}
                      <div className="bg-muted-bg rounded-2xl p-4 space-y-3">
                        <h3 className="font-bold text-navy text-base">{listing.title}</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <Info label="Type" value={FLAT_LABELS[listing.room_type] ?? listing.room_type} />
                          <Info label="Rent" value={`₹${listing.rent?.toLocaleString('en-IN')}/mo`} />
                          <Info label="Deposit" value={`₹${listing.deposit?.toLocaleString('en-IN')}`} />
                          <Info label="Status" value={listing.is_active ? '✅ Active' : '🚫 Removed'} />
                          <Info label="Address" value={listing.address} />
                          <Info label="Posted" value={new Date(listing.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
                        </div>
                        {listing.description && (
                          <p className="text-sm text-text-muted leading-relaxed border-t border-border-light pt-3">{listing.description}</p>
                        )}
                        <a href={`/listings/${listing.id}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-semibold text-coral hover:underline">
                          View full listing <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Poster profile */}
                      <div className="bg-white rounded-2xl border border-border-light p-4">
                        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <UserCircle2 className="w-3.5 h-3.5" /> Listed By
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-navy/10 shrink-0 flex items-center justify-center">
                            {poster.avatar_url
                              ? <img src={poster.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xl font-black text-navy">{(poster.name || '?')[0]?.toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <div className="font-bold text-navy">{poster.name}</div>
                            <div className="text-xs text-text-muted flex items-center gap-1"><Mail className="w-3 h-3" />{poster.email}</div>
                            <div className={`text-xs font-semibold mt-0.5 ${poster.verified_status === 'VERIFIED' ? 'text-success' : 'text-amber-600'}`}>
                              {poster.verified_status}
                            </div>
                          </div>
                          {poster.verification_badge && <Shield className="w-5 h-5 text-success ml-auto" />}
                        </div>
                        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${poster.is_active === false ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                          Account {poster.is_active === false ? 'Suspended' : 'Active'}
                        </div>
                      </div>

                      {/* Other listings */}
                      {otherListings?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5" /> Other listings by this user ({otherListings.length})
                          </h3>
                          <div className="space-y-2">
                            {otherListings.map((l: any) => (
                              <a key={l.id} href={`/listings/${l.id}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 rounded-xl border border-border-light hover:border-coral/40 hover:bg-coral/[0.02] transition-all group">
                                <div>
                                  <div className="font-semibold text-sm text-navy group-hover:text-coral transition-colors">{l.title}</div>
                                  <div className="text-xs text-text-muted">₹{l.rent?.toLocaleString('en-IN')}/mo · {FLAT_LABELS[l.room_type] ?? l.room_type}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                    {l.is_active ? 'Active' : 'Removed'}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-text-muted" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* ── USER DETAILS ── */}
                {detailsPanel.report.target_type === 'USER' && (() => {
                  const { userProfile, userListings } = detailsPanel.data
                  return (
                    <>
                      {/* Profile card */}
                      <div className="bg-muted-bg rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-border-light shrink-0 flex items-center justify-center">
                          {userProfile.avatar_url
                            ? <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-2xl font-black text-navy">{(userProfile.name || '?')[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="font-bold text-navy text-base truncate">{userProfile.name}</div>
                          <div className="text-xs text-text-muted flex items-center gap-1"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{userProfile.email}</span></div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${userProfile.verified_status === 'VERIFIED' ? 'bg-success/10 text-success' : 'bg-amber-100 text-amber-700'}`}>
                              {userProfile.verified_status}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${userProfile.is_active === false ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                              {userProfile.is_active === false ? 'Suspended' : 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <Info label="Gender" value={userProfile.gender?.toLowerCase() ?? '—'} />
                        <Info label="Branch" value={userProfile.branch ?? '—'} />
                        <Info label="Year" value={userProfile.year ? `Year ${userProfile.year}` : '—'} />
                        <Info label="Member since" value={new Date(userProfile.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
                        {userProfile.rejection_reason && (
                          <div className="col-span-2">
                            <Info label="Rejection reason" value={userProfile.rejection_reason} />
                          </div>
                        )}
                      </div>

                      {/* Their listings */}
                      {userListings?.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5" /> Listings by this user ({userListings.length})
                          </h3>
                          <div className="space-y-2">
                            {userListings.map((l: any) => {
                              const thumb = l.listing_images?.find((i: any) => i.is_primary)?.url ?? l.listing_images?.[0]?.url
                              return (
                                <a key={l.id} href={`/listings/${l.id}`} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl border border-border-light hover:border-coral/40 hover:bg-coral/[0.02] transition-all group">
                                  <div className="w-10 h-9 rounded-lg overflow-hidden bg-muted-bg shrink-0">
                                    {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 m-auto text-text-muted mt-2" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-navy group-hover:text-coral transition-colors truncate">{l.title}</div>
                                    <div className="text-xs text-text-muted">₹{l.rent?.toLocaleString('en-IN')}/mo</div>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${l.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                    {l.is_active ? 'Active' : 'Removed'}
                                  </span>
                                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {(!userListings || userListings.length === 0) && (
                        <p className="text-sm text-text-muted text-center py-4">This user has no listings.</p>
                      )}
                    </>
                  )
                })()}

                {/* Report summary */}
                <div className="bg-danger/[0.04] border border-danger/20 rounded-2xl p-4">
                  <h3 className="text-xs font-bold text-danger uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Report Info
                  </h3>
                  <div className="text-sm space-y-1">
                    <div><span className="text-text-muted">Reason:</span> <span className="font-semibold">{REASON_LABELS[detailsPanel.report.reason]}</span></div>
                    {detailsPanel.report.description && (
                      <div><span className="text-text-muted">Details:</span> <span className="text-text-primary">{detailsPanel.report.description}</span></div>
                    )}
                    <div><span className="text-text-muted">Reporter:</span> <span className="font-medium">{detailsPanel.report.reporter?.name} ({detailsPanel.report.reporter?.email})</span></div>
                  </div>
                </div>

                {/* Quick action buttons inside panel */}
                {(() => {
                  const r = detailsPanel.report
                  const isActive = r.status === 'OPEN' || r.status === 'REVIEWING'
                  const listingRemoved = r.target_type === 'LISTING' && r.listing_is_active === false
                  return isActive ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border-light">
                      {r.status === 'OPEN' && (
                        <Button size="sm" variant="outline" disabled={loadingId === r.id}
                          onClick={() => updateStatus(r.id, 'REVIEWING')}
                          className="text-amber-600 border-amber-300 hover:bg-amber-50">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Under Review
                        </Button>
                      )}
                      {r.target_type === 'LISTING' && !listingRemoved && (
                        <Button size="sm" variant="destructive" disabled={loadingId === r.id}
                          onClick={() => handleRemoveListing(r.target_id, r.id)}>
                          <Ban className="w-3.5 h-3.5 mr-1" /> Block Listing
                        </Button>
                      )}
                      {r.target_type === 'LISTING' && listingRemoved && (
                        <Button size="sm" variant="outline" disabled={loadingId === r.id}
                          onClick={() => handleRestoreListing(r.target_id, r.id)}
                          className="border-success/40 text-success hover:bg-success/5">
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore Listing
                        </Button>
                      )}
                      {r.target_type === 'USER' && (
                        <Button size="sm" variant="destructive" disabled={loadingId === r.id}
                          onClick={() => handleSuspend(r.target_id, r.id)}>
                          <Ban className="w-3.5 h-3.5 mr-1" /> Suspend User
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={loadingId === r.id}
                        onClick={() => updateStatus(r.id, 'RESOLVED')}
                        className="border-success text-success hover:bg-success/5">
                        <Check className="w-3.5 h-3.5 mr-1" /> Resolve
                      </Button>
                      <Button size="sm" variant="outline" disabled={loadingId === r.id}
                        onClick={() => updateStatus(r.id, 'DISMISSED')}>
                        <X className="w-3.5 h-3.5 mr-1" /> Dismiss
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-2 border-t border-border-light">
                      <Button size="sm" variant="outline" disabled={loadingId === r.id}
                        onClick={() => handleReopen(r)}
                        className="text-text-muted hover:text-navy">
                        <RotateCcw className="w-3 h-3 mr-1" /> Reopen
                      </Button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white rounded-xl border border-border-light p-3">
      <div className="text-[10px] font-bold text-text-muted uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-navy">{value ?? '—'}</div>
    </div>
  )
}
