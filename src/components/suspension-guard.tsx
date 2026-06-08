import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * SuspensionGuard — Server component.
 * Runs on every server render (page load / refresh).
 * If the logged-in user's is_active = false → redirect to /suspended.
 * Skips check for unauthenticated users, admin routes, and the /suspended page itself.
 */
export async function SuspensionGuard({ pathname }: { pathname?: string }) {
  // Don't check on auth pages, admin, or the suspended page itself
  const skip = ['/suspended', '/login', '/signup', '/admin']
  if (pathname && skip.some(p => pathname.startsWith(p))) return null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()

    if (profile && profile.is_active === false) {
      redirect('/suspended')
    }
  } catch {
    // If profile fetch fails, don't block the user
  }

  return null
}
