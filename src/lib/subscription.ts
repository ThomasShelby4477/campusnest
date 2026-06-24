/**
 * Subscription helpers — shared between client and server.
 *
 * Centralises all subscription-related logic so that gating checks
 * are consistent across API routes, Server Components, and Client Components.
 */

import type { Profile } from '@/types/database'

/* ── Plan definitions ───────────────────────────────────────── */

export const PLANS = {
  'pro-semester': {
    id: 'pro-semester',
    name: 'CampusNest Pro',
    description: 'Semester Plan',
    priceInPaise: 19900,       // ₹199
    durationDays: 150,          // ~5 months (one semester)
    displayPrice: '₹199',
    displayDuration: 'semester',
  },
} as const

export type PlanId = keyof typeof PLANS

/* ── Subscription status checks ─────────────────────────────── */

/**
 * Returns true if the user has an active (non-expired) Pro subscription.
 * Admins are always treated as Pro.
 */
export function isProUser(profile: Pick<Profile, 'role' | 'subscription_status' | 'subscription_expires_at'> | null): boolean {
  if (!profile) return false
  if (profile.role === 'ADMIN') return true
  return (
    profile.subscription_status === 'PRO' &&
    !!profile.subscription_expires_at &&
    new Date(profile.subscription_expires_at) > new Date()
  )
}

/**
 * Returns true if the user can show interest on a listing.
 * Requires: verified + (pro OR admin).
 */
export function canShowInterest(
  profile: Pick<Profile, 'role' | 'verified_status' | 'subscription_status' | 'subscription_expires_at'> | null
): boolean {
  if (!profile) return false
  if (profile.role === 'ADMIN') return true
  return profile.verified_status === 'VERIFIED' && isProUser(profile)
}

/**
 * Returns true if the user can create property listings.
 * Requires: verified + (pro OR admin).
 */
export function canCreateListing(
  profile: Pick<Profile, 'role' | 'verified_status' | 'subscription_status' | 'subscription_expires_at'> | null
): boolean {
  if (!profile) return false
  if (profile.role === 'ADMIN') return true
  return profile.verified_status === 'VERIFIED' && isProUser(profile)
}

/**
 * Returns the number of days remaining in the subscription,
 * or 0 if expired / not subscribed.
 */
export function daysRemaining(
  profile: Pick<Profile, 'subscription_status' | 'subscription_expires_at'> | null
): number {
  if (!profile?.subscription_expires_at) return 0
  if (profile.subscription_status !== 'PRO') return 0
  const diff = new Date(profile.subscription_expires_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
