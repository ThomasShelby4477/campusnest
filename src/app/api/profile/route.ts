import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { csrfGuard } from '@/lib/csrf'

// [SECURITY C-1] Only allow safe, user-editable fields.
// 'role', 'verified_status', 'verification_badge' are intentionally excluded
// to prevent privilege escalation — these are set by admin routes only.
const updateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  year: z.number().int().min(1).max(5).optional(),
  branch: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number')
    .optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  looking_for_buddy: z.boolean().optional(),
  avatar_url: z.string().url().optional(),
})

export async function PATCH(request: NextRequest) {
  // [SECURITY H-5] Reject cross-origin mutation requests
  const csrfError = csrfGuard(request)
  if (csrfError) return csrfError

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = updateSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message)
      return NextResponse.json({ error: errors[0] }, { status: 422 })
    }

    const { error } = await supabase
      .from('profiles')
      .update(result.data)
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('profile route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (err) {
    console.error('profile GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
