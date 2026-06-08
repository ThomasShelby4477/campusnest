'use client'

import { useEffect, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { toast } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/types/database'
import { GlobalListeners } from '@/components/global-listeners'

function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading, clearUser } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const { profile } = await res.json()
          setUser(profile as Profile | null)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }

    fetchProfile()

    // ── Auth state listener ───────────────────────────────────
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const { profile } = await res.json()
            // If the profile came back but is suspended, kick them out immediately
            if (profile?.is_active === false) {
              // Must call server-side signout first to clear HttpOnly cookies
              try { await fetch('/api/auth/signout', { method: 'POST' }) } catch { /* best-effort */ }
              await supabase.auth.signOut()
              clearUser()
              toast.error('Your account has been suspended. For disputes, contact email@campusnest.com', {
                duration: 6000,
                id: 'account-suspended',
              })
              setTimeout(() => { window.location.href = '/suspended' }, 800)
              return
            }
            setUser(profile as Profile | null)
          }
        } catch { /* ignore */ }
      } else if (event === 'SIGNED_OUT') {
        clearUser()
        // Only redirect to /login if not already navigating to a dedicated page
        // (e.g., /suspended or /login itself — avoids racing with suspension redirect)
        const dest = window.location.pathname
        const publicPaths = ['/login', '/signup', '/suspended', '/']
        const onPublicPath = publicPaths.some(p =>
          dest === p || dest.startsWith('/listings/')
        )
        if (!onPublicPath) {
          window.location.href = '/login'
        }
      }
    })

    // ── Realtime suspension watcher ───────────────────────────
    // Subscribes to the logged-in user's own profile row.
    // Fires the moment an admin sets is_active = false,
    // regardless of what page the user is on.
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    const setupRealtimeWatch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      realtimeChannel = supabase
        .channel(`suspension-watch-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          async (payload) => {
            const updated = payload.new as any
            if (updated?.is_active === false) {
              // Admin just suspended this user — kick out immediately
              try { await fetch('/api/auth/signout', { method: 'POST' }) } catch { /* best-effort */ }
              await supabase.auth.signOut()
              clearUser()
              toast.error('Your account has been suspended. For disputes, contact email@campusnest.com', {
                duration: 6000,
                id: 'account-suspended',
              })
              setTimeout(() => { window.location.href = '/suspended' }, 800)
            }
          }
        )
        .subscribe()
    }

    setupRealtimeWatch()

    // ── Tab visibility / focus check ─────────────────────────
    // Re-validates suspension every time the user switches back to this tab.
    // This catches ban/unban/ban cycles where Realtime might have missed a change.
    const checkSuspension = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.status === 401) {
          clearUser()
          window.location.href = '/login'
          return
        }
        if (res.ok) {
          const { profile } = await res.json()
          if (profile?.is_active === false) {
            try { await fetch('/api/auth/signout', { method: 'POST' }) } catch { /* best-effort */ }
            await supabase.auth.signOut()
            clearUser()
            toast.error('Your account has been suspended. For disputes, contact email@campusnest.com', {
              duration: 6000,
              id: 'account-suspended',
            })
            setTimeout(() => { window.location.href = '/suspended' }, 800)
          }
        }
      } catch { /* ignore network errors */ }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSuspension()
    }
    const handleFocus = () => checkSuspension()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      authSubscription.unsubscribe()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      if (realtimeChannel) supabase.removeChannel(realtimeChannel)
    }
  }, [setUser, setLoading, clearUser])

  return <>{children}</>
}


export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        {children}
        <GlobalListeners />
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </AuthProvider>
    </TooltipProvider>
  )
}
