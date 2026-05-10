import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const { email, token } = await req.json()

  if (!email || !token) {
    return NextResponse.json({ error: 'Email and token are required' }, { status: 400 })
  }

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

  console.log('[verify-otp] Verifying OTP for:', email)
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })
  console.log('[verify-otp] Result:', { userId: data?.user?.id, error: error?.message })

  if (error) {
    return NextResponse.json({ error: error.message || 'Invalid OTP' }, { status: 400 })
  }

  if (!data.user) {
    return NextResponse.json({ error: 'No user returned' }, { status: 400 })
  }

  // Session cookies are now set. Determine where to redirect.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, name, student_id_path, verified_status')
    .eq('id', data.user.id)
    .single()

  console.log('[verify-otp] Profile:', profile)

  let redirectTo = '/search'

  if (!profile) {
    redirectTo = '/signup'
  } else if (profile.role === 'ADMIN') {
    redirectTo = '/admin'
  } else if (!profile.name) {
    redirectTo = '/signup'
  } else if (profile.role === 'STUDENT' && !profile.student_id_path) {
    redirectTo = '/signup'
  } else if (profile.verified_status === 'PENDING' || profile.verified_status === 'REJECTED') {
    redirectTo = '/signup'
  }

  console.log('[verify-otp] Redirecting to:', redirectTo)
  return NextResponse.json({
    redirectTo,
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
  })
}
