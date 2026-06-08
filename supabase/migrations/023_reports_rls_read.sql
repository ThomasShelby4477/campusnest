-- 023_reports_rls_read.sql
-- Allow users to read their own submitted reports
-- (required so the API duplicate-check query works with the anon/user Supabase client)

CREATE POLICY IF NOT EXISTS "Users can read own reports"
  ON reports FOR SELECT
  USING (reporter_id = auth.uid());
