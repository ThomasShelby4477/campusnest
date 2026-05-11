import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/signout
 * Clears the server-side session cookie. Must be called alongside
 * the browser-side supabase.auth.signOut() to fully sign out.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return NextResponse.json({ message: 'Signed out' })
  } catch {
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 })
  }
}
