-- 024_reports_admin_rls.sql
-- Allow admins to read and update all reports via their user JWT.
-- (The server-side API uses the service role, but this also enables
--  direct Supabase Studio access for admin users.)

CREATE POLICY "Admins can read all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update report status"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
