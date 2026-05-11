-- Helper function to check if a user exists by email
-- Uses SECURITY DEFINER so it can read auth.users without exposing it via RLS
CREATE OR REPLACE FUNCTION public.user_exists_by_email(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = lower(user_email)
  );
$$;
