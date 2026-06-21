import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const path = request.nextUrl.searchParams.get('path')
    if (!path) {
      return NextResponse.json(
        { error: 'Missing path parameter' },
        { status: 400 }
      )
    }

    // [F-9] Validate path matches expected pattern to prevent arbitrary storage enumeration.
    // Pattern: <bucket-prefix>/<uuid>/<filename>.<ext>
    const VALID_PATH = /^(id-cards|selfies)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[\w.-]+\.(jpg|jpeg|png|pdf|webp)$/i
    if (!VALID_PATH.test(path)) {
      return NextResponse.json(
        { error: 'Invalid path format' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin.storage
      .from('id-cards')
      .createSignedUrl(path, 300) // 5 min expiry

    if (error) {
      console.error('Signed URL error:', error)
      return NextResponse.json(
        { error: 'Failed to create signed URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (err) {
    console.error('admin signed-url error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
