import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SKIP_PREFIXES = ['/suspended', '/login', '/signup', '/admin', '/api', '/_next', '/favicon']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (SKIP_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const response = NextResponse.next({ request: { headers: request.headers } })

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
  if (!user) return response

  // Check is_active via service role on every navigation — no cache.
  // This is efficient: only runs on actual page navigations, not polling.
  // At 1000 users, this is ~10-20 DB calls/sec max, well within Supabase limits.
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
      const url = request.nextUrl.clone()
      url.pathname = '/suspended'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
