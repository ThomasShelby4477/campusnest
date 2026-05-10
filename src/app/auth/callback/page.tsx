import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * /auth/callback
 *
 * Server-side redirect hub. After verifyOtp() on the browser, we navigate here.
 * By the time the browser makes this request, the session cookie IS set, so
 * the server client can read the profile without any cookie-timing issues.
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect: redirectTo = '/search' } = await searchParams
  console.log('[CALLBACK] Page loaded, redirectTo:', redirectTo)

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  console.log('[CALLBACK] getUser result:', { userId: user?.id, error: userError?.message })

  // Not authenticated — send to login
  if (!user) {
    console.log('[CALLBACK] No user — redirecting to /login')
    redirect('/login')
  }

  // Fetch profile using admin client (bypass RLS entirely)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, name, student_id_path, verified_status')
    .eq('id', user!.id)
    .single()
  console.log('[CALLBACK] Profile fetch:', { profile, error: profileError?.message })

  // No profile yet — needs to complete signup
  if (!profile) {
    console.log('[CALLBACK] No profile — redirecting to /signup')
    redirect('/signup')
  }

  // Role-based routing
  if (profile!.role === 'ADMIN') {
    console.log('[CALLBACK] ADMIN — redirecting to /admin')
    redirect('/admin')
  }

  if (!profile!.name) {
    console.log('[CALLBACK] No name — redirecting to /signup')
    redirect('/signup')
  }

  if (profile!.role === 'STUDENT' && !profile!.student_id_path) {
    console.log('[CALLBACK] Student missing ID — redirecting to /signup')
    redirect('/signup')
  }

  if (profile!.verified_status === 'PENDING' || profile!.verified_status === 'REJECTED') {
    console.log('[CALLBACK] Status', profile!.verified_status, '— redirecting to /signup')
    redirect('/signup')
  }

  console.log('[CALLBACK] Verified user — redirecting to', redirectTo)
  redirect(redirectTo)
}
