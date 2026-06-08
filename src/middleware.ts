import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = [
  '/create-listing',
  '/roommates',
  '/chat',
  '/chats',
  '/saved',
  '/notifications',
  '/my-listings',
  '/interest-requests',
  '/profile',
]
const adminPaths = ['/admin']
const authPaths = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and API routes early — no auth needed
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/suspended')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))
  const isAdmin = adminPaths.some(p => pathname.startsWith(p))
  const isAuthPage = authPaths.some(p => pathname.startsWith(p))

  // ── Unauthenticated users ────────────────────────────────────────────
  if (!user) {
    if (isProtected) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    if (isAdmin) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // ── Authenticated users ──────────────────────────────────────────────

  // Redirect away from auth pages
  if (isAuthPage) {
    return NextResponse.redirect(new URL('/search', request.url))
  }

  // Admin route — verify role via service role (bypasses RLS)
  if (isAdmin) {
    const adminRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
      }
    )
    if (adminRes.ok) {
      const rows = await adminRes.json()
      if (rows?.[0]?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return response
  }

  // ── Suspension check (all authenticated, non-admin, non-auth pages) ──
  // Uses service role key to bypass RLS — authoritative, uncached result.
  const serviceRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_active&limit=1`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      cache: 'no-store',
    }
  )

  if (serviceRes.ok) {
    const rows = await serviceRes.json()
    if (rows?.[0]?.is_active === false) {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
