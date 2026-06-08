-- 023_reports_rls_read.sql
-- Allow users to read their own submitted reports
-- Uses DO block to safely skip if policy already exists

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'reports'
      AND policyname = 'Users can read own reports'
  ) THEN
    CREATE POLICY "Users can read own reports"
      ON reports FOR SELECT
      USING (reporter_id = auth.uid());
  END IF;
END $$;
