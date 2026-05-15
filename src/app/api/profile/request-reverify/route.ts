import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('verified_status')
      .eq('id', user.id)
      .single()

    if (profile?.verified_status !== 'REJECTED') {
      return NextResponse.json({ error: 'Your account is not in a rejected state' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        verified_status: 'PENDING',
        rejection_reason: null,
      })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, verified_status: 'PENDING' })
  } catch (err: any) {
    console.error('Re-verification request error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
