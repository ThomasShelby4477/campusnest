-- 026_audit_logs_admin_rls.sql
-- F-21: Add a SELECT policy on audit_logs so admin users can query audit trails
-- via the Supabase JS client without needing the service role key directly.
-- INSERT/UPDATE/DELETE remain service-role-only (no other policies → blocked by RLS).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'audit_logs'
      AND policyname = 'Admins can read audit logs'
  ) THEN
    CREATE POLICY "Admins can read audit logs"
      ON audit_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
            AND role = 'ADMIN'
        )
      );
  END IF;
END $$;

-- Ensure INSERT stays service-role-only — document this explicitly.
-- No INSERT policy is defined intentionally: only supabaseAdmin (service role)
-- may write audit logs. Any attempt via the anon/user JWT will be silently blocked.
COMMENT ON TABLE audit_logs IS
  'Audit trail table. SELECT: ADMIN role only. INSERT/UPDATE/DELETE: service role only (no RLS policy = blocked).';
