/**
 * [SECURITY H-5] CSRF Protection via Origin header validation.
 *
 * Modern browsers always send the Origin header on cross-site requests.
 * By validating it, we prevent cross-site forms and scripts from
 * successfully making authenticated mutations to our API.
 *
 * This works alongside Supabase cookie-based auth (SameSite=Lax).
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  // Add any additional production domains here if needed
].filter(Boolean)

/**
 * Returns true if the request's Origin is from our own domain.
 * Same-origin requests (no Origin header) are also allowed.
 */
export function isValidOrigin(request: Request): boolean {
  const origin = (request.headers as Headers).get('origin')

  // No Origin header = same-origin request from browser (safe) or server-to-server (safe)
  if (!origin) return true

  // Check against allowed origins
  return ALLOWED_ORIGINS.some((allowed) => origin === allowed)
}

/**
 * Returns a 403 response if the request has an invalid Origin.
 * Returns null if the request is safe.
 */
export function csrfGuard(request: Request): Response | null {
  if (!isValidOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Invalid origin' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}
