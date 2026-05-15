-- 020_listing_auto_verify.sql
-- Auto-verify all listings (only verified users can post, so listing-level verification is redundant)
-- Drop is_verified from the public read RLS policy

-- Change public read policy to only require is_active
DROP POLICY IF EXISTS "Anyone can read active verified listings" ON listings;

CREATE POLICY "Anyone can read active listings"
  ON listings FOR SELECT
  USING (is_active = TRUE);

-- Bulk-verify all existing unverified listings
UPDATE listings SET is_verified = TRUE WHERE is_verified = FALSE;
