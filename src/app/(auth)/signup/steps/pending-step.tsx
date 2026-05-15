'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore, useSignupStore } from '@/stores/auth-store'
import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'

export function PendingStep() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const { setStep } = useSignupStore()
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to realtime changes on own profile
    const channel = supabase
      .channel('my-profile')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          const updated = payload.new as typeof user
          if (updated) {
            updateUser(updated)
            if (updated.verified_status === 'VERIFIED') {
              router.push('/search')
            }
          }
        }
      )
      .subscribe()

    // Also poll every 30 seconds as fallback
    const interval = setInterval(async () => {
      setChecking(true)
      const res = await fetch('/api/profile')
      if (res.ok) {
        const { profile } = await res.json()
        if (profile) {
          updateUser(profile)
          if (profile.verified_status === 'VERIFIED') {
            router.push('/search')
          }
        }
      }
      setChecking(false)
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user?.id, updateUser, router])

  if (user?.verified_status === 'REJECTED') {
    return (
      <Card className="border-border-light shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center mb-3">
            <XCircle className="w-7 h-7 text-danger" />
          </div>
          <CardTitle className="text-2xl font-bold text-text-primary">Verification Rejected</CardTitle>
          <CardDescription className="text-text-muted">
            Unfortunately, your ID could not be verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.rejection_reason && (
            <div className="bg-danger/5 border border-danger/20 rounded-lg p-4">
              <p className="text-sm font-medium text-danger mb-1">Reason:</p>
              <p className="text-sm text-text-primary">{user.rejection_reason}</p>
            </div>
          )}
          <Button
            onClick={() => router.push('/reverify')}
            className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Go to Re-verification
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (user?.verified_status === 'VERIFIED') {
    return (
      <Card className="border-border-light shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mb-3 animate-pulse-glow">
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <CardTitle className="text-2xl font-bold text-text-primary">You&apos;re Verified! 🎉</CardTitle>
          <CardDescription className="text-text-muted">
            Your account has been verified successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => router.push('/search')}
            className="w-full h-12 bg-coral hover:bg-coral-dark text-white font-semibold"
          >
            Start Exploring →
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border-light shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-warning/10 flex items-center justify-center mb-3">
          <Clock className="w-7 h-7 text-warning animate-pulse" />
        </div>
        <CardTitle className="text-2xl font-bold text-text-primary">Verification Pending</CardTitle>
        <CardDescription className="text-text-muted">
          Our team is reviewing your documents. This usually takes a few hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted-bg rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-text-primary">Email verified</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-text-primary">Profile completed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm text-text-primary">ID card uploaded</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-sm text-text-primary font-medium">Admin review in progress...</span>
          </div>
        </div>

        {checking && (
          <p className="text-xs text-text-muted text-center">Checking status...</p>
        )}

        <p className="text-xs text-text-muted text-center">
          You can browse listings while waiting. We&apos;ll notify you when your account is verified.
        </p>

        <Button
          variant="outline"
          onClick={() => router.push('/search')}
          className="w-full h-11"
        >
          Browse Listings (Read-only)
        </Button>
      </CardContent>
    </Card>
  )
}
