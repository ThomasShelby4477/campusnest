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
// Include both page-level /admin and API-level /api/admin for defence-in-depth
const adminPaths = ['/admin', '/api/admin']
const authPaths = ['/login', '/signup']

// ── CSP nonce helper ────────────────────────────────────────────────────────
// Generates a cryptographically random nonce for each request.
// This allows us to use 'nonce-{value}' instead of 'unsafe-inline' in
// script-src, eliminating the biggest XSS amplifier in the CSP.
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // [F-11] 'unsafe-inline' replaced by per-request nonce.
    // 'strict-dynamic' allows Next.js to load its own dynamically-created scripts
    // without needing their hashes listed individually.
    // 'unsafe-eval' retained for Firebase SDK & Next.js dev HMR compatibility.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com`,
    // Styles: Google Fonts CDN requires unsafe-inline for its injected <style> tags.
    // This is an accepted trade-off; inline styles carry a lower XSS risk than scripts.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Images: Supabase storage + Google Maps tiles
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://maps.googleapis.com https://maps.gstatic.com",
    // Network: Supabase REST + Realtime + Firebase FCM + Google Maps
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fcm.googleapis.com https://maps.googleapis.com",
    // Service workers (Firebase SW)
    "worker-src 'self' blob:",
    // Prevent embedding in any foreign frame
    "frame-ancestors 'none'",
  ].join('; ')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and the /suspended page early.
  // Note: we still apply CSP to page routes via the nonce mechanism below.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/suspended')
  ) {
    return NextResponse.next()
  }

  // Non-admin API routes handle their own auth — skip middleware overhead.
  // /api/admin routes pass through for defence-in-depth auth checking.
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  // ── Generate per-request CSP nonce (F-11) ───────────────────────────────
  const nonce = generateNonce()
  const cspHeader = buildCsp(nonce)

  // Forward the nonce to the page via a request header so layout.tsx can
  // read it via next/headers and attach it to inline <script> elements.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Attach CSP to the response so the browser enforces it
  response.headers.set('Content-Security-Policy', cspHeader)

  // Sync Supabase auth cookies
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
      // API admin routes: return JSON 401; page admin routes: redirect to login
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
        // API admin routes: return JSON 403; page admin routes: redirect home
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
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
