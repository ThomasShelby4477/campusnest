import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const bodySchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED']),
})

export async function PATCH(req: NextRequest) {
  try {
    // Auth check — must be an admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const result = bodySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 422 })
    }

    const { reportId, status } = result.data

    const { error } = await supabaseAdmin
      .from('reports')
      .update({ status })
      .eq('id', reportId)

    if (error) {
      console.error('Report status update error:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/reports error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
