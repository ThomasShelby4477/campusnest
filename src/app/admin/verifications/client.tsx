'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, User, GraduationCap, Mail, Phone, Calendar, Shield, Camera, ImageIcon, Loader2 } from 'lucide-react'

interface ProfileWithImages {
  profile: any
  idCardUrl: string | null
  selfieUrl: string | null
  loading: boolean
}

export function VerificationsClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState<ProfileWithImages[]>(
    initialProfiles.map(p => ({ profile: p, idCardUrl: null, selfieUrl: null, loading: false }))
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchSignedUrl = async (path: string | null): Promise<string | null> => {
    if (!path) return null
    try {
      const res = await fetch(`/api/admin/signed-url?path=${encodeURIComponent(path)}`)
      const data = await res.json()
      return data.signedUrl || null
    } catch {
      return null
    }
  }

  const toggleExpand = async (profileId: string) => {
    if (expandedId === profileId) {
      setExpandedId(null)
      return
    }

    setExpandedId(profileId)
    
    const entry = profiles.find(p => p.profile.id === profileId)
    if (!entry || entry.loading) return

    // Fetch images if not already loaded
    if (!entry.idCardUrl && entry.profile.student_id_path) {
      setProfiles(prev => prev.map(p => 
        p.profile.id === profileId ? { ...p, loading: true } : p
      ))
      
      const [idCardUrl, selfieUrl] = await Promise.all([
        fetchSignedUrl(entry.profile.student_id_path),
        fetchSignedUrl(entry.profile.selfie_path),
      ])

      setProfiles(prev => prev.map(p => 
        p.profile.id === profileId ? { ...p, idCardUrl, selfieUrl, loading: false } : p
      ))
    }
  }

  const handleAction = async (userId: string, action: 'VERIFIED' | 'REJECTED') => {
    setActionLoadingId(userId)
    try {
      const res = await fetch('/api/admin/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        toast.error(data.error || 'Failed to update status')
      } else {
        setProfiles(prev => prev.filter(p => p.profile.id !== userId))
        if (expandedId === userId) setExpandedId(null)
        toast.success(action === 'VERIFIED' ? 'User approved!' : 'User rejected')
      }
    } catch {
      toast.error('Network error occurred')
    } finally {
      setActionLoadingId(null)
    }
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
          <Shield className="w-4 h-4 text-warning" />
        </div>
        <p className="text-sm font-semibold text-text-muted">
          {profiles.length} pending verification{profiles.length !== 1 ? 's' : ''}
        </p>
      </div>

      {profiles.map(({ profile, idCardUrl, selfieUrl, loading }) => {
        const isExpanded = expandedId === profile.id
        const isActionLoading = actionLoadingId === profile.id

        return (
          <div
            key={profile.id}
            className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden transition-all duration-300"
          >
            {/* Summary row — clickable */}
            <button
              type="button"
              onClick={() => toggleExpand(profile.id)}
              className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted-bg/50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-navy">
                    {profile.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-navy">{profile.name || 'Unnamed'}</h3>
                <p className="text-sm text-text-muted truncate">{profile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  {profile.year && (
                    <span className="text-xs text-text-muted">{profile.year}{['st','nd','rd','th','th'][(profile.year||1)-1]} Year</span>
                  )}
                  {profile.branch && (
                    <span className="text-xs text-text-muted">• {profile.branch}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-text-muted">
                  {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                )}
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
                    {/* ID Card */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Student ID Card
                      </span>
                      {idCardUrl ? (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-border-light bg-white shadow-sm">
                          <img
                            src={idCardUrl}
                            alt="Student ID Card"
                            className="w-full max-h-[400px] object-contain bg-muted-bg"
                          />
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

                    {/* Selfie */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                        <Camera className="w-3 h-3" /> Selfie Photo
                      </span>
                      {selfieUrl ? (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-border-light bg-white shadow-sm">
                          <img
                            src={selfieUrl}
                            alt="Selfie"
                            className="w-full max-h-[400px] object-contain bg-muted-bg"
                          />
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
                    {isActionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <><CheckCircle className="w-5 h-5 mr-2" /> Approve Verification</>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="flex-1 h-12 font-semibold rounded-2xl shadow-md shadow-danger/20 transition-all hover:shadow-lg active:scale-[0.98]"
                    disabled={isActionLoading}
                    onClick={() => handleAction(profile.id, 'REJECTED')}
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
  )
}
