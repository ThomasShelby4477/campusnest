'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, X, Camera, ImageIcon, Loader2, IdCard, PencilLine } from 'lucide-react'

const BRANCHES = [
  'Computer Science', 'Forensic Science', 'Cyber Security',
  'Digital Forensics', 'Information Technology', 'Biotechnology',
  'Biochemistry', 'Law', 'Commerce', 'Arts', 'Other',
]

export default function ReverifyPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [branch, setBranch] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [idCardUrl, setIdCardUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [idCardLoading, setIdCardLoading] = useState(false)
  const [selfieLoading, setSelfieLoading] = useState(false)

  const [newIdCard, setNewIdCard] = useState<File | null>(null)
  const [newSelfie, setNewSelfie] = useState<File | null>(null)
  const [newIdCardPreview, setNewIdCardPreview] = useState<string | null>(null)
  const [newSelfiePreview, setNewSelfiePreview] = useState<string | null>(null)

  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/reverify')
      return
    }
    if (user.verified_status !== 'REJECTED') {
      router.push('/profile')
      return
    }

    setName(user.name || '')
    setYear(user.year?.toString() || '')
    setBranch(user.branch || '')
    setPhone(user.phone || '')
    setGender(user.gender || '')
    setLoading(false)

    // Load existing images
    const loadImages = async () => {
      if (user.student_id_path) {
        setIdCardLoading(true)
        try {
          const res = await fetch(`/api/user/signed-url?path=${encodeURIComponent(user.student_id_path)}`)
          const data = await res.json()
          if (data.signedUrl) setIdCardUrl(data.signedUrl)
        } catch {}
        setIdCardLoading(false)
      }
      if (user.selfie_path) {
        setSelfieLoading(true)
        try {
          const res = await fetch(`/api/user/signed-url?path=${encodeURIComponent(user.selfie_path)}`)
          const data = await res.json()
          if (data.signedUrl) setSelfieUrl(data.signedUrl)
        } catch {}
        setSelfieLoading(false)
      }
    }
    loadImages()
  }, [])

  const handleFileSelect = (
    file: File,
    setFile: (f: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or PDF files allowed')
      return
    }
    setFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    if (!phone.trim()) { toast.error('Phone is required'); return }
    if (!gender) { toast.error('Gender is required'); return }

    setSubmitting(true)
    try {
      // 1. Update profile info
      const updatePayload: Record<string, unknown> = {
        name, phone, gender,
        year: year ? parseInt(year) : null,
        branch: branch || null,
      }

      // Only include student fields if not a landlord
      if (user?.role !== 'LANDLORD') {
        updatePayload.year = year ? parseInt(year) : null
        updatePayload.branch = branch || null
      }

      const profileRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })
      if (!profileRes.ok) throw new Error('Failed to update profile')

      // 2. Upload new ID card if selected
      if (newIdCard) {
        const formData = new FormData()
        formData.append('file', newIdCard)
        formData.append('type', 'id-card')
        const uploadRes = await fetch('/api/upload/id-card', { method: 'POST', body: formData })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'Failed to upload ID card')
        }
      }

      // 3. Upload new selfie if selected
      if (newSelfie) {
        const formData = new FormData()
        formData.append('file', newSelfie)
        formData.append('type', 'selfie')
        const uploadRes = await fetch('/api/upload/id-card', { method: 'POST', body: formData })
        if (!uploadRes.ok) {
          const err = await uploadRes.json()
          throw new Error(err.error || 'Failed to upload selfie')
        }
      }

      // 4. Request re-verification
      const reverifyRes = await fetch('/api/profile/request-reverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!reverifyRes.ok) {
        const err = await reverifyRes.json()
        throw new Error(err.error || 'Failed to request re-verification')
      }

      // 5. Refresh user state
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        if (profile) setUser(profile)
      }

      toast.success('Re-verification submitted! Our team will review your documents.')
      router.push('/profile')
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-muted-bg">
        <Loader2 className="w-8 h-8 text-coral animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted-bg pb-16">
      {/* Header */}
      <div className="bg-gradient-to-b from-navy/5 via-navy/[0.02] to-transparent pt-10 pb-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center">
              <IdCard className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy">Re-verify Your Identity</h1>
              <p className="text-sm text-text-muted">Update your documents and resubmit for verification</p>
            </div>
          </div>
          {user?.rejection_reason && (
            <div className="mt-4 p-4 bg-danger/5 border border-danger/20 rounded-2xl">
              <p className="text-xs font-bold text-danger uppercase tracking-wide mb-1">Admin Remark</p>
              <p className="text-sm text-text-primary">{user.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile Info Card */}
        <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-navy/10 flex items-center justify-center">
              <PencilLine className="w-3.5 h-3.5 text-navy" />
            </div>
            <h2 className="text-lg font-bold text-navy">Profile Information</h2>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-2xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Phone Number</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-2xl" placeholder="+91..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Gender</Label>
            <Select value={gender} onValueChange={v => setGender(v ?? '')}>
              <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {user?.role !== 'LANDLORD' && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Year of Study</Label>
                <Select value={year} onValueChange={v => setYear(v ?? '')}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(y => (
                      <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">Branch</Label>
                <Select value={branch} onValueChange={v => setBranch(v ?? '')}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {BRANCHES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        {/* Documents Card */}
        <div className="bg-white rounded-3xl border border-border-light shadow-lg shadow-navy/[0.03] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center">
              <IdCard className="w-3.5 h-3.5 text-coral" />
            </div>
            <h2 className="text-lg font-bold text-navy">Verification Documents</h2>
          </div>

          {/* Previously uploaded ID Card */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Previously Uploaded ID Card
            </Label>
            {idCardLoading ? (
              <div className="rounded-2xl border-2 border-border-light bg-muted-bg p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
              </div>
            ) : idCardUrl ? (
              <div className="rounded-2xl overflow-hidden border-2 border-border-light bg-white">
                <img src={idCardUrl} alt="Current ID Card" className="w-full max-h-[300px] object-contain bg-muted-bg" />
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border-light bg-muted-bg p-8 text-center text-text-muted text-sm">
                No ID card previously uploaded
              </div>
            )}
          </div>

          {/* Previously uploaded Selfie */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1">
              <Camera className="w-3 h-3" /> Previously Uploaded Selfie
            </Label>
            {selfieLoading ? (
              <div className="rounded-2xl border-2 border-border-light bg-muted-bg p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
              </div>
            ) : selfieUrl ? (
              <div className="rounded-2xl overflow-hidden border-2 border-border-light bg-white">
                <img src={selfieUrl} alt="Current Selfie" className="w-full max-h-[300px] object-contain bg-muted-bg" />
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border-light bg-muted-bg p-8 text-center text-text-muted text-sm">
                No selfie previously uploaded
              </div>
            )}
          </div>

          <div className="border-t border-border-light pt-4 space-y-4">
            <p className="text-sm font-semibold text-navy">Upload New Documents (if needed)</p>

            {/* New ID Card */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">New ID Card</Label>
              {newIdCardPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-coral bg-white">
                  <img src={newIdCardPreview} alt="New ID Card" className="w-full max-h-[250px] object-contain bg-muted-bg" />
                  <button type="button" onClick={() => { setNewIdCard(null); setNewIdCardPreview(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-danger hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => idInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border-light hover:border-coral/40 rounded-2xl p-6 text-center hover:bg-muted-bg transition-colors">
                  <input ref={idInputRef} type="file" accept="image/jpeg,image/png,application/pdf"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, setNewIdCard, setNewIdCardPreview) }}
                    className="hidden" />
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-primary">Upload new ID card</p>
                  <p className="text-xs text-text-muted mt-1">JPEG, PNG, or PDF · Max 5MB</p>
                </button>
              )}
            </div>

            {/* New Selfie */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-text-muted uppercase tracking-wide">New Selfie</Label>
              {newSelfiePreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-coral bg-white">
                  <img src={newSelfiePreview} alt="New Selfie" className="w-full max-h-[250px] object-contain bg-muted-bg" />
                  <button type="button" onClick={() => { setNewSelfie(null); setNewSelfiePreview(null) }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center hover:bg-danger hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => selfieInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border-light hover:border-coral/40 rounded-2xl p-6 text-center hover:bg-muted-bg transition-colors">
                  <input ref={selfieInputRef} type="file" accept="image/jpeg,image/png"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f, setNewSelfie, setNewSelfiePreview) }}
                    className="hidden" />
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-primary">Upload new selfie</p>
                  <p className="text-xs text-text-muted mt-1">JPEG or PNG · Max 5MB</p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-14 bg-coral hover:bg-coral-dark text-white font-bold text-lg rounded-2xl shadow-lg shadow-coral/20 transition-all hover:shadow-xl hover:shadow-coral/30 active:scale-[0.98]"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </span>
          ) : (
            'Submit for Re-verification'
          )}
        </Button>
      </div>
    </div>
  )
}
