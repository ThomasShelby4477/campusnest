import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { csrfGuard } from '@/lib/csrf'

const reportSchema = z.object({
  target_type: z.enum(['USER', 'LISTING']),
  target_id:   z.string().uuid(),
  reason:      z.enum(['FAKE_LISTING', 'SCAM', 'HARASSMENT', 'SPAM', 'DISCRIMINATION', 'OTHER']),
  description: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  // CSRF guard
  const csrfError = csrfGuard(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: max 10 reports per hour per user
    const rl = rateLimit(`reports:create:${user.id}`, { limit: 10, windowMs: 60 * 60 * 1000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many reports. Please wait before submitting again.' }, { status: 429 })
    }

    const body = await request.json()
    const result = reportSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 422 }
      )
    }

    const { target_type, target_id, reason, description } = result.data

    // Prevent self-reporting
    if (target_type === 'USER' && target_id === user.id) {
      return NextResponse.json({ error: 'You cannot report yourself' }, { status: 400 })
    }

    // Check if user has already reported this entity (prevent duplicate spam)
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_id', target_id)
      .eq('status', 'OPEN')
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted an open report for this. Our team is reviewing it.' },
        { status: 409 }
      )
    }

    // Insert report
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type,
        target_id,
        reason,
        description: description || null,
        status: 'OPEN',
      })

    if (insertError) {
      console.error('Report insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Report submitted successfully' })
  } catch (err) {
    console.error('POST /api/reports error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
