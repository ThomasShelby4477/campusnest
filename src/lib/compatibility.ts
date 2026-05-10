/**
 * Inline compatibility scoring — fallback for when the
 * Supabase Edge Function is unavailable.
 *
 * Weights total 100 points.
 */

import type { UserPreferences, Gender } from '@/types/database'

interface ScoringInput {
  viewerPrefs: UserPreferences
  viewerGender: Gender | null
  targetPrefs: UserPreferences
  targetGender: Gender | null
}

export function computeCompatibilityScore({
  viewerPrefs,
  viewerGender,
  targetPrefs,
  targetGender,
}: ScoringInput): number {
  // ── Gender pref hard filter ───────────────────────────────
  if (
    targetPrefs.gender_pref &&
    targetPrefs.gender_pref !== 'ANY' &&
    viewerGender &&
    targetPrefs.gender_pref !== viewerGender
  ) {
    return -1 // excluded
  }
  if (
    viewerPrefs.gender_pref &&
    viewerPrefs.gender_pref !== 'ANY' &&
    targetGender &&
    viewerPrefs.gender_pref !== targetGender
  ) {
    return -1 // excluded
  }

  let score = 0

  // ── Budget overlap (20 pts) ───────────────────────────────
  const vMin = viewerPrefs.budget_min ?? 0
  const vMax = viewerPrefs.budget_max ?? 30000
  const tMin = targetPrefs.budget_min ?? 0
  const tMax = targetPrefs.budget_max ?? 30000
  const overlap = Math.max(0, Math.min(vMax, tMax) - Math.max(vMin, tMin))
  const smallerRange = Math.min(vMax - vMin, tMax - tMin)
  if (smallerRange > 0) {
    score += Math.round((overlap / smallerRange) * 20)
  } else {
    score += 20 // both have same single-value budget
  }

  // ── Sleep schedule (15 pts) ───────────────────────────────
  if (viewerPrefs.sleep_schedule && targetPrefs.sleep_schedule) {
    if (viewerPrefs.sleep_schedule === targetPrefs.sleep_schedule) {
      score += 15
    } else if (
      viewerPrefs.sleep_schedule === 'FLEXIBLE' ||
      targetPrefs.sleep_schedule === 'FLEXIBLE'
    ) {
      score += 8
    }
    // EARLY_BIRD vs NIGHT_OWL → 0
  } else {
    score += 8 // one or both unset → neutral
  }

  // ── Cleanliness (15 pts) ──────────────────────────────────
  if (viewerPrefs.cleanliness != null && targetPrefs.cleanliness != null) {
    const diff = Math.abs(viewerPrefs.cleanliness - targetPrefs.cleanliness)
    if (diff === 0) score += 15
    else if (diff === 1) score += 10
    else if (diff === 2) score += 5
    // diff >= 3 → 0
  } else {
    score += 8
  }

  // ── Smoking (15 pts) ──────────────────────────────────────
  if (viewerPrefs.smoking != null && targetPrefs.smoking != null) {
    if (viewerPrefs.smoking === targetPrefs.smoking) score += 15
  } else {
    score += 8
  }

  // ── Drinking (10 pts) ─────────────────────────────────────
  if (viewerPrefs.drinking != null && targetPrefs.drinking != null) {
    if (viewerPrefs.drinking === targetPrefs.drinking) score += 10
  } else {
    score += 5
  }

  // ── Food pref (10 pts) ────────────────────────────────────
  if (viewerPrefs.food_pref && targetPrefs.food_pref) {
    if (
      viewerPrefs.food_pref === 'ANY' ||
      targetPrefs.food_pref === 'ANY' ||
      viewerPrefs.food_pref === targetPrefs.food_pref
    ) {
      score += 10
    }
  } else {
    score += 5
  }

  // ── Personality (5 pts) ───────────────────────────────────
  if (viewerPrefs.personality && targetPrefs.personality) {
    if (viewerPrefs.personality === targetPrefs.personality) score += 5
  } else {
    score += 3
  }

  // ── Gender pref passed filter (10 pts) ────────────────────
  score += 10

  return Math.min(100, Math.max(0, score))
}

export function computeBatchScores(
  viewerPrefs: UserPreferences,
  viewerGender: Gender | null,
  targets: Array<{
    prefs: UserPreferences
    gender: Gender | null
    userId: string
  }>
): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const target of targets) {
    scores[target.userId] = computeCompatibilityScore({
      viewerPrefs,
      viewerGender,
      targetPrefs: target.prefs,
      targetGender: target.gender,
    })
  }
  return scores
}
