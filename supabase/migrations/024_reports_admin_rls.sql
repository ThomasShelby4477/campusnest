-- 024_reports_admin_rls.sql
-- Allow admin-role users to read and update all reports
-- Uses DO block to safely skip if policies already exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'reports'
      AND policyname = 'Admins can read all reports'
  ) THEN
    CREATE POLICY "Admins can read all reports"
      ON reports FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'reports'
      AND policyname = 'Admins can update report status'
  ) THEN
    CREATE POLICY "Admins can update report status"
      ON reports FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END $$;
