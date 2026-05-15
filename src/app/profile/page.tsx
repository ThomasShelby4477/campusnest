'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import Link from 'next/link'
import { User, Settings, Shield, Heart, LogOut, ChevronRight, Pencil, Save, X, Camera, Loader2, RefreshCw } from 'lucide-react'

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [branch, setBranch] = useState('')
  const [phone, setPhone] = useState('')
  const [lookingForBuddy, setLookingForBuddy] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Use setTimeout to avoid synchronous setState warning in Next.js
      setTimeout(() => {
        setName(user.name || '')
        setYear(user.year?.toString() || '')
        setBranch(user.branch || '')
        setPhone(user.phone || '')
        setLookingForBuddy(user.looking_for_buddy)
      }, 0)
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-muted-bg">
        <span className="w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      name,
      year: parseInt(year) || null,
      branch,
      phone,
      looking_for_buddy: lookingForBuddy,
    }).eq('id', user.id)

    if (error) {
      toast.error('Failed to save profile')
    } else {
      setUser({ ...user, name, year: parseInt(year) || null, branch, phone, looking_for_buddy: lookingForBuddy })
      toast.success('Profile updated')
      setEditing(false)
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    // Per Supabase docs: call signOut on the browser client.
    // createBrowserClient (@supabase/ssr) clears auth cookies automatically.
    // onAuthStateChange('SIGNED_OUT') in providers.tsx then calls setUser(null).
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const file = e.target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to upload avatar')
      }

      const { avatar_url } = await res.json()
      setUser({ ...user, avatar_url })
      toast.success('Profile picture updated!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setUploadingAvatar(false)
      // Clear input so same file can be selected again
      e.target.value = ''
    }
  }

  const verifiedBadge = user.verified_status === 'VERIFIED'

  return (
    <div className="min-h-[calc(100vh-64px)] bg-muted-bg pb-24 sm:pb-12">
      <div className="max-w-2xl mx-auto pt-8 px-4">

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-navy to-navy-light flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm group">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
              
              {/* Avatar Upload Overlay */}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-text-primary truncate">{user.name || 'Unnamed User'}</h1>
                {verifiedBadge && (
                  <Shield className="w-5 h-5 text-success shrink-0" />
                )}
              </div>
              <p className="text-text-muted text-sm mb-1">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  user.verified_status === 'VERIFIED' ? 'bg-success/10 text-success' :
                  user.verified_status === 'PENDING' ? 'bg-warning/10 text-warning' :
                  user.verified_status === 'REJECTED' ? 'bg-danger/10 text-danger' :
                  'bg-muted-bg text-text-muted'
                }`}>
                  {user.verified_status}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-navy/10 text-navy">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <User className="w-5 h-5" /> Profile Details
            </h2>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-navy hover:bg-navy-dark text-white gap-1">
                  <Save className="w-4 h-4" /> Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <div>
              <Label className="text-text-muted text-xs font-bold uppercase tracking-wider">Full Name</Label>
              {editing ? (
                <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" />
              ) : (
                <p className="mt-1 font-medium text-text-primary">{user.name || '—'}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-text-muted text-xs font-bold uppercase tracking-wider">Year</Label>
                {editing ? (
                  <Select value={year} onValueChange={(v) => setYear(v ?? '')}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}{['st','nd','rd','th','th'][y-1]} Year</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 font-medium text-text-primary">{user.year ? `${user.year}${['st','nd','rd','th','th'][(user.year || 1) - 1]} Year` : '—'}</p>
                )}
              </div>
              <div>
                <Label className="text-text-muted text-xs font-bold uppercase tracking-wider">Branch</Label>
                {editing ? (
                  <Input value={branch} onChange={e => setBranch(e.target.value)} className="mt-1" />
                ) : (
                  <p className="mt-1 font-medium text-text-primary">{user.branch || '—'}</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-text-muted text-xs font-bold uppercase tracking-wider">Phone</Label>
              {editing ? (
                <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="+91..." />
              ) : (
                <p className="mt-1 font-medium text-text-primary">{user.phone || '—'}</p>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border-light">
              <div>
                <Label className="text-text-primary font-bold flex items-center gap-2"><Heart className="w-4 h-4 text-coral" /> Looking for house-hunting buddy</Label>
                <p className="text-text-muted text-xs mt-1">Toggle this on to appear in the Buddies tab</p>
              </div>
              <Switch checked={lookingForBuddy} onCheckedChange={async (checked) => {
                setLookingForBuddy(checked)
                await supabase.from('profiles').update({ looking_for_buddy: checked }).eq('id', user.id)
                setUser({ ...user, looking_for_buddy: checked })
                toast.success(checked ? 'You\'re now looking for buddies!' : 'Buddy mode disabled')
              }} />
            </div>
          </div>
        </div>

        {/* Rejection status + re-verification */}
        {user.verified_status === 'REJECTED' && (
          <div className="bg-white rounded-2xl border border-danger/20 p-6 sm:p-8 shadow-sm mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-danger" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-navy mb-1">Verification Rejected</h2>
                {user.rejection_reason && (
                  <p className="text-sm text-text-muted mb-3 leading-relaxed">
                    Reason: {user.rejection_reason}
                  </p>
                )}
                <p className="text-sm text-text-muted mb-4">
                  Please update your documents and request re-verification.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/profile/request-reverify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      })
                      const data = await res.json()
                      if (!res.ok || data.error) throw new Error(data.error)
                      setUser({ ...user, verified_status: 'PENDING', rejection_reason: null })
                      toast.success('Re-verification requested! Please re-upload your documents.')
                      router.push('/profile')
                    } catch {
                      toast.error('Failed to request re-verification')
                    }
                  }}
                  className="bg-coral hover:bg-coral-dark text-white font-semibold rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Request Re-verification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm mb-6">
          {[
            { label: 'My Listings', href: '/my-listings', icon: '🏠' },
            { label: 'Interest Requests', href: '/interest-requests', icon: '🤝' },
            { label: 'Saved Listings', href: '/saved', icon: '❤️' },
            { label: 'Roommate Preferences', href: '/roommates/quiz', icon: '🧩' },
            { label: 'Notifications', href: '/notifications', icon: '🔔' },
          ].map((item, i) => (
            <Link key={i} href={item.href} className="flex items-center justify-between p-4 hover:bg-muted-bg transition-colors border-b border-border-light last:border-b-0">
              <span className="flex items-center gap-3 font-medium text-text-primary">
                <span className="text-lg">{item.icon}</span> {item.label}
              </span>
              <ChevronRight className="w-4 h-4 text-text-muted" />
            </Link>
          ))}
        </div>

        {/* Danger Zone */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/profile/settings" className="flex-1">
            <Button variant="outline" className="w-full gap-2 border-danger/30 text-danger hover:bg-danger/5 hover:text-danger">
              <Settings className="w-4 h-4" /> Account Settings
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="flex-1 gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>

      </div>
    </div>
  )
}
