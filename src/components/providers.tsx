'use client'

import { useEffect, type ReactNode } from 'react'
import { Toaster } from 'sonner'
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
              await supabase.auth.signOut()
              clearUser()
              window.location.href = '/suspended'
              return
            }
            setUser(profile as Profile | null)
          }
        } catch { /* ignore */ }
      } else if (event === 'SIGNED_OUT') {
        clearUser()
        // Only redirect if not already on an auth/public page
        const publicPaths = ['/login', '/signup', '/suspended', '/']
        const onPublicPath = publicPaths.some(p =>
          window.location.pathname === p || window.location.pathname.startsWith('/listings/')
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
              window.location.href = '/suspended'
            }
          }
        )
        .subscribe()
    }

    setupRealtimeWatch()

    return () => {
      authSubscription.unsubscribe()
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
