import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { csrfGuard } from '@/lib/csrf'

/**
 * PATCH /api/interest-requests/[id]
 * Accept or decline an interest request (poster only).
 * On accept: creates a match with chat_type='LISTING' and notifies requester.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // [F-5] CSRF guard — prevents cross-site accept/decline forgery
    const csrfError = csrfGuard(request)
    if (csrfError) return csrfError

    const { id: requestId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const action = body.action as 'accept' | 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Fetch the interest request
    const { data: ir, error: irErr } = await supabaseAdmin
      .from('interest_requests')
      .select('*, listings(title), requester:profiles!interest_requests_requester_id_fkey(name)')
      .eq('id', requestId)
      .single()

    if (irErr || !ir) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Only the poster can accept/decline
    if (ir.poster_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (ir.status !== 'PENDING') {
      return NextResponse.json({ error: 'Request already processed' }, { status: 400 })
    }

    const newStatus = action === 'accept' ? 'ACCEPTED' : 'DECLINED'

    // Update status
    await supabaseAdmin
      .from('interest_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', requestId)

    if (action === 'accept') {
      // Create a match for listing-based chat
      // matches table requires user_a_id < user_b_id
      const [userA, userB] = [user.id, ir.requester_id].sort()

      // Check if a match already exists
      const { data: existingMatch } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('user_a_id', userA)
        .eq('user_b_id', userB)
        .single()

      let matchId = existingMatch?.id

      if (!matchId) {
        const { data: newMatch, error: matchErr } = await supabaseAdmin
          .from('matches')
          .insert({ user_a_id: userA, user_b_id: userB, chat_type: 'LISTING' })
          .select('id')
          .single()

        if (matchErr) {
          console.error('match creation error:', matchErr)
          return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
        }
        matchId = newMatch?.id
      }

      // Get poster name
      const { data: posterProfile } = await supabaseAdmin
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      // Notify requester
      await supabaseAdmin.from('notifications').insert({
        user_id: ir.requester_id,
        type: 'INTEREST_ACCEPTED',
        title: 'Interest Accepted! 🎉',
        body: `${posterProfile?.name || 'The poster'} accepted your interest in "${(ir as any).listings?.title || 'a listing'}". You can now chat!`,
        link: `/chat/${matchId}`,
      })

      return NextResponse.json({ message: 'Accepted', matchId })
    } else {
      // Notify requester of decline
      const { data: posterProfile } = await supabaseAdmin
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      await supabaseAdmin.from('notifications').insert({
        user_id: ir.requester_id,
        type: 'INTEREST_DECLINED',
        title: 'Interest Update',
        body: `The poster of "${(ir as any).listings?.title || 'a listing'}" has declined your request at this time.`,
        link: '/search',
      })

      return NextResponse.json({ message: 'Declined' })
    }
  } catch (err) {
    console.error('interest-request PATCH error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
