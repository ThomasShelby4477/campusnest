import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Paths that never need a suspension check ──────────────────
  const skipPrefixes = [
    '/suspended',
    '/login',
    '/signup',
    '/admin',
    '/api',
    '/_next',
    '/favicon',
  ]
  if (skipPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Create a response we can mutate (refresh session cookies)
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Build Supabase client with the request cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed session tokens to both request and response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get the current user (validates JWT against Supabase)
  const { data: { user } } = await supabase.auth.getUser()

  // No session → nothing to check
  if (!user) return response

  // Check is_active — user can always read their own profile via RLS
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single()

  // Suspended → hard redirect to /suspended on every request
  if (profile?.is_active === false) {
    const url = request.nextUrl.clone()
    url.pathname = '/suspended'
    return NextResponse.redirect(url)
  }

  return response
}

// Run middleware on all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
