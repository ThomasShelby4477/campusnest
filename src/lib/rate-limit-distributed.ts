/**
 * Distributed rate limiter backed by Supabase PostgreSQL.
 *
 * WHY THIS EXISTS:
 * The original in-memory rate limiter (src/lib/rate-limit.ts) uses a Map that
 * lives inside a single serverless function instance. Vercel runs each concurrent
 * request in its own isolated instance, so the Map is never shared — every
 * instance sees only its own requests and the limit is never actually enforced.
 *
 * This implementation calls a PostgreSQL function (check_and_increment_rate_limit)
 * which is a single authoritative store for all instances, making rate limits
 * work correctly in a distributed/serverless environment.
 *
 * FAIL-OPEN POLICY:
 * If the database call fails (transient error, cold start, etc.), the function
 * returns { success: true } so legitimate users are never blocked by an
 * infrastructure glitch. The original in-memory check still runs as a fast
 * pre-filter for the most obvious abuse before hitting the DB.
 */

import { supabaseAdmin } from './supabase/admin'
import { rateLimit } from './rate-limit'

export interface DistributedRateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Check and increment a distributed rate limit counter.
 *
 * Uses a two-layer approach:
 * 1. Fast in-memory pre-check (catches obvious per-instance abuse cheaply)
 * 2. Authoritative PostgreSQL check (shared across all serverless instances)
 *
 * @param key       Unique key for this rate limit bucket (e.g. "otp:ip:1.2.3.4")
 * @param limit     Maximum number of requests allowed in the window
 * @param windowMs  Window size in milliseconds
 */
export async function rateLimitDistributed(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<DistributedRateLimitResult> {
  // ── Layer 1: Fast in-memory pre-check ───────────────────────────────────
  // If this single instance has already seen too many requests, reject
  // immediately without a DB round-trip.
  const memCheck = rateLimit(key, { limit, windowMs })
  if (!memCheck.success) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: memCheck.resetAt,
    }
  }

  // ── Layer 2: Authoritative distributed check ─────────────────────────────
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'check_and_increment_rate_limit',
      {
        p_key: key,
        p_limit: limit,
        p_window_ms: windowMs,
      }
    )

    if (error) {
      // Fail open — log but don't block legitimate users
      console.error('[rate-limit-distributed] DB check failed:', error.message)
      return {
        success: true,
        limit,
        remaining: 1,
        resetAt: Date.now() + windowMs,
      }
    }

    const result = data as {
      allowed: boolean
      count: number
      limit: number
      reset_at: number
    }

    return {
      success: result.allowed,
      limit: result.limit,
      remaining: Math.max(0, result.limit - result.count),
      resetAt: result.reset_at,
    }
  } catch (err) {
    // Fail open on unexpected errors (network timeout, etc.)
    console.error('[rate-limit-distributed] Unexpected error:', err)
    return {
      success: true,
      limit,
      remaining: 1,
      resetAt: Date.now() + windowMs,
    }
  }
}
