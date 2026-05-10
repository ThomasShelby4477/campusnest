import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface RequestBody {
  viewer_id: string
  target_ids: string[]
}

interface Preferences {
  budget_min: number | null
  budget_max: number | null
  sleep_schedule: string | null
  cleanliness: number | null
  smoking: boolean | null
  drinking: boolean | null
  food_pref: string | null
  personality: string | null
  gender_pref: string | null
}

function scoreCompatibility(a: Preferences, aGender: string | null, b: Preferences, bGender: string | null): number {
  // Gender pref hard filter
  if (b.gender_pref && b.gender_pref !== 'ANY' && aGender && b.gender_pref !== aGender) return -1
  if (a.gender_pref && a.gender_pref !== 'ANY' && bGender && a.gender_pref !== bGender) return -1

  let score = 0

  // Budget overlap (20 pts)
  const vMin = a.budget_min ?? 0
  const vMax = a.budget_max ?? 30000
  const tMin = b.budget_min ?? 0
  const tMax = b.budget_max ?? 30000
  const overlap = Math.max(0, Math.min(vMax, tMax) - Math.max(vMin, tMin))
  const smallerRange = Math.min(vMax - vMin, tMax - tMin)
  if (smallerRange > 0) {
    score += Math.round((overlap / smallerRange) * 20)
  } else {
    score += 20
  }

  // Sleep schedule (15 pts)
  if (a.sleep_schedule && b.sleep_schedule) {
    if (a.sleep_schedule === b.sleep_schedule) score += 15
    else if (a.sleep_schedule === 'FLEXIBLE' || b.sleep_schedule === 'FLEXIBLE') score += 8
  } else {
    score += 8
  }

  // Cleanliness (15 pts)
  if (a.cleanliness != null && b.cleanliness != null) {
    const diff = Math.abs(a.cleanliness - b.cleanliness)
    if (diff === 0) score += 15
    else if (diff === 1) score += 10
    else if (diff === 2) score += 5
  } else {
    score += 8
  }

  // Smoking (15 pts)
  if (a.smoking != null && b.smoking != null) {
    if (a.smoking === b.smoking) score += 15
  } else {
    score += 8
  }

  // Drinking (10 pts)
  if (a.drinking != null && b.drinking != null) {
    if (a.drinking === b.drinking) score += 10
  } else {
    score += 5
  }

  // Food pref (10 pts)
  if (a.food_pref && b.food_pref) {
    if (a.food_pref === 'ANY' || b.food_pref === 'ANY' || a.food_pref === b.food_pref) score += 10
  } else {
    score += 5
  }

  // Personality (5 pts)
  if (a.personality && b.personality) {
    if (a.personality === b.personality) score += 5
  } else {
    score += 3
  }

  // Gender pref passed (10 pts)
  score += 10

  return Math.min(100, Math.max(0, score))
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { viewer_id, target_ids } = (await req.json()) as RequestBody

    if (!viewer_id || !target_ids?.length) {
      return new Response(JSON.stringify({ error: 'Missing viewer_id or target_ids' }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fetch viewer's profile + preferences
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('gender')
      .eq('id', viewer_id)
      .single()

    const { data: viewerPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', viewer_id)
      .single()

    if (!viewerPrefs) {
      return new Response(JSON.stringify({ error: 'Viewer has no preferences' }), { status: 400 })
    }

    // Fetch target profiles + preferences
    const { data: targetProfiles } = await supabase
      .from('profiles')
      .select('id, gender')
      .in('id', target_ids)

    const { data: targetPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .in('user_id', target_ids)

    const prefsMap = new Map<string, Preferences>()
    targetPrefs?.forEach((p: Preferences & { user_id: string }) => prefsMap.set(p.user_id, p))

    const genderMap = new Map<string, string | null>()
    targetProfiles?.forEach((p: { id: string; gender: string | null }) => genderMap.set(p.id, p.gender))

    const scores: Record<string, number> = {}
    for (const targetId of target_ids) {
      const tp = prefsMap.get(targetId)
      if (!tp) {
        scores[targetId] = 0
        continue
      }
      scores[targetId] = scoreCompatibility(
        viewerPrefs,
        viewerProfile?.gender ?? null,
        tp,
        genderMap.get(targetId) ?? null
      )
    }

    return new Response(JSON.stringify({ scores }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('compute-compatibility error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
})
