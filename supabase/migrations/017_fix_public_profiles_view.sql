-- 017_fix_public_profiles_view.sql
-- Fixes the SECURITY DEFINER warning by recreating the view with security_invoker = true

DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles WITH (security_invoker = true) AS
  SELECT id, name, avatar_url, year, branch,
         verified_status, verification_badge,
         looking_for_buddy, gender
  FROM profiles
  WHERE is_active = TRUE;
