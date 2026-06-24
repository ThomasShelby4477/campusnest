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
  process.env.NEXT_PUBLIC_SITE_URL,
  // Optional: set ADDITIONAL_ALLOWED_ORIGIN for dev tunnels (e.g. ngrok)
  process.env.ADDITIONAL_ALLOWED_ORIGIN,
  // Vercel deployment URLs
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : null,
  process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:3000' : null,
  process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:3001' : null,
].filter(Boolean) as string[]

/**
 * Returns true if the request's Origin is from our own domain.
 * Same-origin requests (no Origin header) are also allowed.
 */
export function isValidOrigin(request: Request): boolean {
  const origin = (request.headers as Headers).get('origin')

  // No Origin header = same-origin request from browser (safe) or server-to-server (safe)
  if (!origin) return true

  // Check against allowed origins
  if (ALLOWED_ORIGINS.some((allowed) => origin === allowed)) return true

  // Allow Vercel preview deployments dynamically
  if (origin.endsWith('.vercel.app')) return true

  // In development, allow any local IP (e.g. 192.168.x.x, 10.x.x.x)
  if (process.env.NODE_ENV !== 'production') {
    if (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.')
    ) {
      return true
    }
  }

  return false
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
