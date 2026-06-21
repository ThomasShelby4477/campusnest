-- 027_rate_limits_table.sql
-- F-7: Supabase-backed distributed rate limiter.
-- Replaces per-instance in-memory Map with a shared PostgreSQL table, making
-- rate limits work correctly across all Vercel serverless instances.

CREATE TABLE IF NOT EXISTS rate_limits (
  key         TEXT PRIMARY KEY,
  count       INTEGER      NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ  NOT NULL
);

-- Index for efficient expiry sweeps
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits (expires_at);

-- ── Core RPC ────────────────────────────────────────────────────────────────
-- Atomically increments the counter for `p_key` within the sliding window.
-- Returns whether the request is allowed plus metadata for Retry-After headers.
CREATE OR REPLACE FUNCTION check_and_increment_rate_limit(
  p_key        TEXT,
  p_limit      INTEGER,
  p_window_ms  BIGINT        -- window size in milliseconds
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now         TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ := v_now - (p_window_ms::TEXT || ' ms')::INTERVAL;
  v_expires_at  TIMESTAMPTZ := v_now + (p_window_ms::TEXT || ' ms')::INTERVAL;
  v_count       INTEGER;
  v_reset_at    TIMESTAMPTZ;
BEGIN
  -- Periodic cleanup of expired keys to keep table small
  DELETE FROM rate_limits WHERE expires_at < v_now AND key = p_key;

  INSERT INTO rate_limits (key, count, window_start, expires_at)
  VALUES (p_key, 1, v_now, v_expires_at)
  ON CONFLICT (key) DO UPDATE
    SET
      -- If the stored window has expired, start a fresh window; otherwise increment
      count = CASE
        WHEN rate_limits.window_start < v_window_start THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < v_window_start THEN v_now
        ELSE rate_limits.window_start
      END,
      expires_at = CASE
        WHEN rate_limits.window_start < v_window_start THEN v_expires_at
        ELSE GREATEST(rate_limits.expires_at, v_expires_at)
      END
  RETURNING count,
            CASE
              WHEN rate_limits.window_start < v_window_start THEN v_expires_at
              ELSE GREATEST(rate_limits.expires_at, v_expires_at)
            END
  INTO v_count, v_reset_at;

  RETURN jsonb_build_object(
    'allowed',   v_count <= p_limit,
    'count',     v_count,
    'limit',     p_limit,
    -- reset_at as Unix ms — matches the in-memory RateLimitEntry.resetAt field
    'reset_at',  (EXTRACT(EPOCH FROM COALESCE(v_reset_at, v_expires_at)) * 1000)::BIGINT
  );
END;
$$;

-- Only the service role (server-side) may call this function.
REVOKE EXECUTE ON FUNCTION check_and_increment_rate_limit FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION check_and_increment_rate_limit TO service_role;

-- RLS: service role bypasses RLS; anon/authenticated are blocked by the REVOKE above.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE rate_limits IS
  'Distributed rate-limit counters shared across all serverless instances. '
  'Written exclusively by server-side code via the service role.';
