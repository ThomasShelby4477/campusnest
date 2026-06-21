import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { csrfGuard } from '@/lib/csrf'

/**
 * POST /api/auth/signout
 *
 * Properly terminates the session:
 * 1. Calls supabase.auth.signOut() to revoke the refresh token server-side
 * 2. Manually expires every Supabase auth cookie so the browser removes them
 */
export async function POST(req: NextRequest) {
  // [F-5] CSRF guard — prevent forced cross-site logout
  const csrfError = csrfGuard(req)
  if (csrfError) return csrfError

  try {
    const cookieStore = await cookies()
    const supabase = await createClient()

    // Revoke the server-side session / refresh token
    await supabase.auth.signOut()

    // Build a response and manually clear every supabase auth cookie.
    // supabase/ssr sets HttpOnly cookies — the browser JS client cannot clear them.
    const response = NextResponse.json({ message: 'Signed out' })

    const allCookies = cookieStore.getAll()
    for (const cookie of allCookies) {
      // Clear all cookies that belong to Supabase auth
      if (
        cookie.name.startsWith('sb-') ||
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth-token')
      ) {
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
    }

    return response
  } catch (err) {
    console.error('Sign out error:', err)
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
}
