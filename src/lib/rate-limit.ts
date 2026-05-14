/**
 * Simple in-memory rate limiter using a sliding window.
 * Works well for single-instance deployments (Vercel serverless per-region).
 * For multi-region or high-traffic, migrate to Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit: number
  /** Window size in milliseconds */
  windowMs: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // Fresh window
    const resetAt = now + options.windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: options.limit - 1, resetAt }
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: options.limit - entry.count, resetAt: entry.resetAt }
}

/** Extract IP from a Next.js request for use as rate limit key */
export function getClientIp(request: Request): string {
  const fwd = (request.headers as Headers).get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  const realIp = (request.headers as Headers).get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}
