-- Enable Realtime on the profiles table so the browser
-- receives instant push notification when is_active changes.
-- This is required for the suspension to take effect immediately
-- without a page reload.
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
