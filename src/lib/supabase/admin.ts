import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * CRITICAL: Only import this in /app/api/** routes (server-side only).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Lazily initialized to avoid build-time crashes when env vars
 * are not available during static page generation.
 */
let _adminClient: SupabaseClient | null = null

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_adminClient) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!url || !key) {
        throw new Error(
          '[supabaseAdmin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
          'Ensure these are set in your environment variables.'
        )
      }
      _adminClient = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
    return (_adminClient as any)[prop]
  },
})
