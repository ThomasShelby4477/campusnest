import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail, verificationApprovedEmail, verificationRejectedEmail } from '@/lib/email'

const actionSchema = z.object({
  user_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user: admin },
    } = await supabase.auth.getUser()

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', admin.id)
      .single()

    if (adminProfile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = actionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid input' },
        { status: 422 }
      )
    }

    const { user_id, action, reason } = result.data

    // Fetch target user profile
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('email, name, verified_status')
      .eq('id', user_id)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetProfile.verified_status !== 'PENDING') {
      return NextResponse.json(
        { error: 'User is not in PENDING status' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Update profile to VERIFIED
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          verified_status: 'VERIFIED',
          verification_badge: true,
          rejection_reason: null,
        })
        .eq('id', user_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to approve user' },
          { status: 500 }
        )
      }

      // Insert notification
      await supabaseAdmin.from('notifications').insert({
        user_id,
        type: 'VERIFICATION_APPROVED',
        title: 'Account Verified! ✅',
        body: 'Your student ID has been verified. You now have full access to CampusNest.',
        link: '/search',
      })

      // Send email
      try {
        const email = verificationApprovedEmail(targetProfile.name || 'Student')
        await sendEmail({
          to: targetProfile.email,
          ...email,
        })
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr)
      }

      // Audit log
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: admin.id,
        action: 'VERIFY_APPROVE',
        target_type: 'USER',
        target_id: user_id,
        metadata: { email: targetProfile.email },
      })

      return NextResponse.json({ message: 'User approved successfully' })
    } else {
      // Reject
      if (!reason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 422 }
        )
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          verified_status: 'REJECTED',
          rejection_reason: reason,
          verification_badge: false,
        })
        .eq('id', user_id)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to reject user' },
          { status: 500 }
        )
      }

      // Insert notification
      await supabaseAdmin.from('notifications').insert({
        user_id,
        type: 'VERIFICATION_REJECTED',
        title: 'Verification Update',
        body: `Your ID verification was not approved: ${reason}`,
        link: '/signup',
      })

      // Send email
      try {
        const email = verificationRejectedEmail(
          targetProfile.name || 'Student',
          reason
        )
        await sendEmail({
          to: targetProfile.email,
          ...email,
        })
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr)
      }

      // Audit log
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: admin.id,
        action: 'VERIFY_REJECT',
        target_type: 'USER',
        target_id: user_id,
        metadata: { email: targetProfile.email, reason },
      })

      return NextResponse.json({ message: 'User rejected' })
    }
  } catch (err) {
    console.error('admin verify error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: list pending verifications
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: pending, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name, year, branch, gender, student_id_path, selfie_path, verified_status, created_at')
      .eq('verified_status', 'PENDING')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch pending verifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ verifications: pending })
  } catch (err) {
    console.error('admin verifications GET error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
