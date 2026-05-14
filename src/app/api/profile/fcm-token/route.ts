import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fcm_token } = await request.json()

    if (!fcm_token) {
      return NextResponse.json({ error: 'Missing fcm_token' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token })
      .eq('id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    // [SECURITY M-2] Log full error server-side only — never expose details to client
    console.error('FCM token update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
