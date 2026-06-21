import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeBatchScores } from '@/lib/compatibility'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get current user's preferences + profile
    const { data: viewerPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('gender, verified_status')
      .eq('id', user.id)
      .single()

    if (!viewerPrefs || viewerProfile?.verified_status !== 'VERIFIED') {
      return NextResponse.json({ error: 'Must be verified and complete quiz' }, { status: 403 })
    }

    // 2. Query VERIFIED users who completed quiz, excluding user
    const { data: targets, error: targetError } = await supabase
      .from('profiles')
      .select(`
        id, 
        name, 
        avatar_url, 
        year, 
        branch, 
        gender,
        looking_for_buddy,
        user_preferences!inner(*)
      `)
      .eq('verified_status', 'VERIFIED')
      .eq('is_active', true)  // exclude suspended users from roommate feed
      .neq('id', user.id)
      .eq('user_preferences.quiz_completed', true)


    if (targetError) throw targetError

    // Exclude already liked
    const { data: likes } = await supabase
      .from('roommate_likes')
      .select('liked_id')
      .eq('liker_id', user.id)
    const likedIds = new Set(likes?.map(l => l.liked_id) || [])

    // Exclude already matched
    const { data: matches } = await supabase
      .from('matches')
      .select('user_a_id, user_b_id')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    const matchedIds = new Set(matches?.map(m => m.user_a_id === user.id ? m.user_b_id : m.user_a_id) || [])

    const excludedIds = new Set([...likedIds, ...matchedIds])

    const validTargets = targets?.filter(t => !excludedIds.has(t.id)) || []
    if (validTargets.length === 0) return NextResponse.json({ results: [] })

    // We can call edge function here, but since fallback logic is identically implemented 
    // in lib/compatibility, we can use that to avoid edge function deployment complexity for now
    // Or we try calling edge function, fallback to inline on fail.
    
    let scores: Record<string, number> = {}
    
    // Fallback inline execution
    const computeInput = validTargets.map(t => ({
      userId: t.id,
      gender: t.gender,
      prefs: Array.isArray(t.user_preferences) ? t.user_preferences[0] : t.user_preferences
    }))
    
    scores = computeBatchScores(viewerPrefs, viewerProfile.gender, computeInput)

    // Append scores and sort
    // [F-17] Project only display-essential fields — do NOT expose raw preference data
    // (smoking, drinking, budget, etc.) of other users to the viewer.
    const scoredTargets = validTargets
      .map(t => ({
        id: t.id,
        name: t.name,
        avatar_url: t.avatar_url,
        year: t.year,
        branch: t.branch,
        gender: t.gender,
        looking_for_buddy: t.looking_for_buddy,
        compatibility: scores[t.id] ?? -1,
      }))
      .filter(t => t.compatibility >= 0) // filter out gender mismatches
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, 20) // top 20

    return NextResponse.json({ results: scoredTargets })
  } catch (error) {
    console.error('Roommate feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
