'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Trash2, Volume2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem('sound_enabled')
    if (saved !== null) {
      setSoundEnabled(saved !== 'false')
    }
  }, [])

  const handleToggleSound = (checked: boolean) => {
    setSoundEnabled(checked)
    localStorage.setItem('sound_enabled', checked ? 'true' : 'false')
    if (checked) {
      import('@/lib/sound').then(({ playNotificationSound }) => playNotificationSound())
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure? This action cannot be undone. All your listings, messages, and matches will be deleted.")) {
      return
    }

    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      const { error } = await supabase.from('profiles').update({
        is_active: false,
        name: 'Deleted User',
        phone: null
      }).eq('id', authUser.id)

      if (error) {
        toast.error('Failed to delete account data')
        setLoading(false)
        return
      }

      // Full sign-out: server cookies + client state
      try { await fetch('/api/auth/signout', { method: 'POST' }) } catch { /* best-effort */ }
      await supabase.auth.signOut()
      toast.success('Account deleted')
      window.location.href = '/'
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-black text-navy mb-8">Account Settings</h1>

      <div className="space-y-6">
        {/* Preferences Section */}
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy flex items-center gap-2 mb-6">
            <Volume2 className="w-5 h-5" /> Preferences
          </h2>
          
          <div className="flex items-center justify-between py-4 border-t border-border-light">
            <div className="space-y-0.5">
              <Label htmlFor="sound-notifications" className="text-base font-bold text-navy">
                Sound Notifications
              </Label>
              <p className="text-sm text-text-muted">
                Play a sound when you receive a new message or notification.
              </p>
            </div>
            <Switch
              id="sound-notifications"
              checked={soundEnabled}
              onCheckedChange={handleToggleSound}
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-border-light p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-danger flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-text-muted mb-6">
              Permanently delete your account and all associated data. This action is irreversible. 
              Per our privacy policy, your data will be queued for complete deletion within 30 days.
            </p>
          </div>

          <Button 
            variant="destructive" 
            onClick={handleDeleteAccount} 
            disabled={loading}
            className="bg-danger hover:bg-danger/90 text-white font-bold flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Processing...' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </div>
  )
}
