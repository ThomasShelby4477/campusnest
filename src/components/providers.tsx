'use client'

import { useEffect, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/types/database'
import { GlobalListeners } from '@/components/global-listeners'

function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const { profile } = await res.json()
            setUser(profile as Profile | null)
          }
        } catch { /* ignore */ }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])


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
