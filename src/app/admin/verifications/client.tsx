'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp, User, GraduationCap,
  Mail, Phone, Calendar, Shield, Camera, ImageIcon, Loader2, Search, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react'

interface ProfileWithImages {
  profile: any
  idCardUrl: string | null
  selfieUrl: string | null
  loading: boolean
}

type SortKey = 'newest' | 'oldest' | 'name_az' | 'name_za'

export function VerificationsClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState<ProfileWithImages[]>(
    initialProfiles.map(p => ({ profile: p, idCardUrl: null, selfieUrl: null, loading: false }))
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ userId: string; userName: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // ── Search / Filter / Sort state ──────────────────────────────
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [sort, setSort] = useState<SortKey>('newest')

  const supabase = createClient()

  // ── Filtered + sorted list ────────────────────────────────────
  const filtered = useMemo(() => {
    let list = profiles

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(({ profile: p }) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.branch || '').toLowerCase().includes(q)
      )
    }
    if (yearFilter !== 'ALL') list = list.filter(({ profile: p }) => String(p.year) === yearFilter)
    if (genderFilter !== 'ALL') list = list.filter(({ profile: p }) => p.gender === genderFilter)
    if (roleFilter !== 'ALL') list = list.filter(({ profile: p }) => p.role === roleFilter)

    list = [...list].sort((a, b) => {
      const pa = a.profile, pb = b.profile
      if (sort === 'newest') return new Date(pb.created_at).getTime() - new Date(pa.created_at).getTime()
      if (sort === 'oldest') return new Date(pa.created_at).getTime() - new Date(pb.created_at).getTime()
      if (sort === 'name_az') return (pa.name || '').localeCompare(pb.name || '')
      if (sort === 'name_za') return (pb.name || '').localeCompare(pa.name || '')
      return 0
    })
    return list
  }, [profiles, search, yearFilter, genderFilter, roleFilter, sort])

  const hasActiveFilter = search || yearFilter !== 'ALL' || genderFilter !== 'ALL' || roleFilter !== 'ALL'

  const fetchSignedUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null
    try {
      const res = await fetch(`/api/admin/signed-url?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      return data.signedUrl || null
    } catch { return null }
  }

  const toggleExpand = async (profileId: string) => {
    if (expandedId === profileId) { setExpandedId(null); return }
    setExpandedId(profileId)
    const entry = profiles.find(p => p.profile.id === profileId)
    if (!entry || entry.loading) return
    if (!entry.idCardUrl && entry.profile.student_id_path) {
      setProfiles(prev => prev.map(p => p.profile.id === profileId ? { ...p, loading: true } : p))
      const [idCardUrl, selfieUrl] = await Promise.all([
        fetchSignedUrl(entry.profile.student_id_path),
        fetchSignedUrl(entry.profile.selfie_path),
      ])
      setProfiles(prev => prev.map(p => p.profile.id === profileId ? { ...p, idCardUrl, selfieUrl, loading: false } : p))
    }
  }

  const handleAction = async (userId: string, action: 'VERIFIED' | 'REJECTED', reason?: string) => {
    setActionLoadingId(userId)
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to update status')
      } else {
        setProfiles(prev => prev.filter(p => p.profile.id !== userId))
        if (expandedId === userId) setExpandedId(null)
        toast.success(action === 'VERIFIED' ? 'User approved!' : 'User rejected')
      }
    } catch { toast.error('Network error occurred') }
    finally { setActionLoadingId(null); setRejectDialog(null); setRejectReason('') }
  }

  if (profiles.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-navy mb-1">All Caught Up</h2>
        <p className="text-text-muted">No pending verifications to review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Search + Filters bar ──────────────────────────────── */}
      <div className="bg-white border border-border-light rounded-2xl p-3 space-y-3 shadow-sm">
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Search by name, email or branch…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted-bg border-0 focus-visible:ring-1"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2">
          {/* Year */}
          <Select value={yearFilter} onValueChange={v => setYearFilter(v)}>
            <SelectTrigger className="h-9 w-[110px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Years</SelectItem>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
              <SelectItem value="4">4th Year</SelectItem>
            </SelectContent>
          </Select>

          {/* Gender */}
          <Select value={genderFilter} onValueChange={v => setGenderFilter(v)}>
            <SelectTrigger className="h-9 w-[110px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <User className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>

          {/* Role */}
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v)}>
            <SelectTrigger className="h-9 w-[110px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="LANDLORD">Landlord</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[130px] rounded-xl bg-muted-bg border-0 text-xs font-semibold">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-text-muted" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name_az">Name A → Z</SelectItem>
              <SelectItem value="name_za">Name Z → A</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilter && (
            <button
              onClick={() => { setSearch(''); setYearFilter('ALL'); setGenderFilter('ALL'); setRoleFilter('ALL') }}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-coral hover:bg-coral/5 transition-colors border border-coral/20"
            >
              Clear filters
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto self-center text-xs font-semibold text-text-muted whitespace-nowrap">
            {filtered.length} / {profiles.length} pending
          </span>
        </div>
      </div>

      {/* ── Empty state for no results ──────────────────────── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-border-light p-12 text-center text-text-muted text-sm">
          <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-30" />
          No verifications match your filters.
        </div>
      )}

      {/* ── Verification cards ──────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map(({ profile, idCardUrl, selfieUrl, loading }) => {
          const isExpanded = expandedId === profile.id
          const isActionLoading = actionLoadingId === profile.id

          return (
            <div
              key={profile.id}
              className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden transition-all duration-300"
            >
              {/* Summary row */}
              <button
                type="button"
                onClick={() => toggleExpand(profile.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted-bg/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-navy">{profile.name?.charAt(0)?.toUpperCase() || '?'}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy">{profile.name || 'Unnamed'}</h3>
                  <p className="text-sm text-text-muted truncate">{profile.email}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {profile.year && (
                      <span className="text-xs text-text-muted bg-muted-bg px-2 py-0.5 rounded-full">
                        {profile.year}{['st','nd','rd','th','th'][(profile.year||1)-1]} Year
                      </span>
                    )}
                    {profile.branch && (
                      <span className="text-xs text-text-muted bg-muted-bg px-2 py-0.5 rounded-full">{profile.branch}</span>
                    )}
                    {profile.gender && (
                      <span className="text-xs text-text-muted bg-muted-bg px-2 py-0.5 rounded-full capitalize">{profile.gender.toLowerCase()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-text-muted hidden sm:inline">
                    {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                </div>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="border-t border-border-light bg-muted-bg/30 p-5 sm:p-6 space-y-6">
                  {/* Profile Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3" /> Name</span>
                      <p className="text-sm font-semibold text-navy">{profile.name || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
                      <p className="text-sm font-semibold text-navy truncate">{profile.email}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
                      <p className="text-sm font-semibold text-navy">{profile.phone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Year</span>
                      <p className="text-sm font-semibold text-navy">{profile.year ? `${profile.year}${['st','nd','rd','th','th'][(profile.year||1)-1]} Year` : '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Branch</span>
                      <p className="text-sm font-semibold text-navy">{profile.branch || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3" /> Registered</span>
                      <p className="text-sm font-semibold text-navy">{new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><Shield className="w-3 h-3" /> Role</span>
                      <p className="text-sm font-semibold text-navy">{profile.role}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1"><User className="w-3 h-3" /> Gender</span>
                      <p className="text-sm font-semibold text-navy">{profile.gender || '—'}</p>
                    </div>
                  </div>

                  {/* ID Documents */}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-coral animate-spin" />
                      <span className="ml-2 text-sm text-text-muted">Loading documents...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Student ID Card
                        </span>
                        {idCardUrl ? (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-border-light bg-white shadow-sm">
                            <img src={idCardUrl} alt="Student ID Card" className="w-full max-h-[400px] object-contain bg-muted-bg" />
                          </div>
                        ) : profile.student_id_path ? (
                          <div className="rounded-2xl border-2 border-border-light bg-muted-bg p-8 text-center text-text-muted text-sm">
                            <ImageIcon className="w-6 h-6 mx-auto mb-2" /> Unable to load ID card
                          </div>
                        ) : (
                          <div className="rounded-2xl border-2 border-dashed border-border-light bg-muted-bg p-8 text-center text-text-muted text-sm">
                            <ImageIcon className="w-6 h-6 mx-auto mb-2" /> No ID card uploaded
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                          <Camera className="w-3 h-3" /> Selfie Photo
                        </span>
                        {selfieUrl ? (
                          <div className="relative rounded-2xl overflow-hidden border-2 border-border-light bg-white shadow-sm">
                            <img src={selfieUrl} alt="Selfie" className="w-full max-h-[400px] object-contain bg-muted-bg" />
                          </div>
                        ) : profile.selfie_path ? (
                          <div className="rounded-2xl border-2 border-border-light bg-muted-bg p-8 text-center text-text-muted text-sm">
                            <Camera className="w-6 h-6 mx-auto mb-2" /> Unable to load selfie
                          </div>
                        ) : (
                          <div className="rounded-2xl border-2 border-dashed border-border-light bg-muted-bg p-8 text-center text-text-muted text-sm">
                            <Camera className="w-6 h-6 mx-auto mb-2" /> No selfie provided
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border-light">
                    <Button
                      size="lg"
                      className="flex-1 h-12 bg-success hover:bg-success/90 text-white font-semibold rounded-2xl shadow-md shadow-success/20 transition-all hover:shadow-lg active:scale-[0.98]"
                      disabled={isActionLoading}
                      onClick={() => handleAction(profile.id, 'VERIFIED')}
                    >
                      {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5 mr-2" /> Approve</>}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      className="flex-1 h-12 font-semibold rounded-2xl shadow-md shadow-danger/20 transition-all hover:shadow-lg active:scale-[0.98]"
                      disabled={isActionLoading}
                      onClick={() => { setRejectDialog({ userId: profile.id, userName: profile.name }); setRejectReason('') }}
                    >
                      <XCircle className="w-5 h-5 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) setRejectDialog(null) }}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-danger" /> Reject Verification
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be shown to <strong>{rejectDialog?.userName}</strong> so they can fix the issue and re-submit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="e.g. ID card is blurry, please upload a clearer photo."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] rounded-2xl resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {['ID card is blurry or unreadable', 'Wrong document uploaded', 'Name on ID does not match', 'Selfie does not match ID card'].map(quick => (
                <button key={quick} type="button" onClick={() => setRejectReason(quick)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border-light hover:border-coral/40 hover:bg-coral/[0.04] text-text-muted hover:text-coral transition-colors">
                  {quick}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(null)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive"
              onClick={() => rejectDialog && handleAction(rejectDialog.userId, 'REJECTED', rejectReason.trim() || undefined)}
              className="rounded-xl shadow-md shadow-danger/20">
              <XCircle className="w-4 h-4 mr-2" /> Reject with Reason
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
