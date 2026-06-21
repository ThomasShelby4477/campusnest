import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'nfsu.ac.in'

export async function POST(req: Request) {
  const { email, token, redirect } = await req.json()

  if (!email || !token) {
    return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
  }

  // [F-12] Re-validate institutional email domain at the verification stage
  if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    return NextResponse.json({ error: 'Invalid email domain' }, { status: 422 })
  }

  // [F-8] Validate redirect is a safe relative path — block open-redirect attacks
  const safeRedirect =
    typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : null

  const cookieStore = await cookies()

  // Use server-side Supabase so it can set session cookies in the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* ignore in server components */ }
        },
      },
    }
  )

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    // Supabase Auth returns this when the user has a ban_duration set
    const isBanned =
      error.message?.toLowerCase().includes('banned') ||
      error.message?.toLowerCase().includes('user is banned')
    if (isBanned) {
      return NextResponse.json(
        {
          suspended: true,
          error: 'Your account has been suspended due to a violation of our community guidelines. If you believe this is a mistake, please contact us at email@campusnest.com',
        },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message || 'Invalid OTP' }, { status: 400 })
  }

  if (!data.user) {
    return NextResponse.json({ error: 'No user returned' }, { status: 400 })
  }

  // Session cookies are now set. Determine where to redirect.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, name, student_id_path, verified_status, is_active')
    .eq('id', data.user.id)
    .single()

  // ── Suspension gate ──────────────────────────────────────────
  // If the account is suspended, revoke the fresh session immediately
  // so the tokens are never sent to the browser.
  if (profile?.is_active === false) {
    try {
      await supabaseAdmin.auth.admin.signOut(data.user.id, 'global')
    } catch { /* best-effort */ }
    return NextResponse.json(
      {
        suspended: true,
        error: 'Your account has been suspended due to a violation of our community guidelines. If you believe this is a mistake, please contact us at email@campusnest.com',
      },
      { status: 403 }
    )
  }

  let redirectTo = safeRedirect || '/search'

  if (!profile) {
    // No profile row yet — brand new user, needs to complete signup
    redirectTo = '/signup'
  } else if (profile.role === 'ADMIN') {
    redirectTo = '/admin'
  } else if (!profile.name) {
    // Profile exists but name not filled in yet
    redirectTo = '/signup'
  } else if (profile.role === 'STUDENT' && !profile.student_id_path) {
    // Student hasn't uploaded ID yet
    redirectTo = '/signup'
  } else if (profile.verified_status === 'PENDING') {
    // Docs uploaded, awaiting review — show pending screen
    redirectTo = '/signup'
  } else if (profile.verified_status === 'REJECTED') {
    // Admin rejected — needs to resubmit
    redirectTo = '/reverify'
  } else if (profile.verified_status === 'VERIFIED') {
    // Fully verified — go wherever they were trying to go
    redirectTo = safeRedirect || '/search'
  }

  // [F-3] Session is established via HttpOnly cookies set above.
  // Do NOT return raw tokens in the response body — they are not needed
  // by the client and would be accessible to third-party JS / network tab.
  return NextResponse.json({ redirectTo })
}
