-- 019_add_listing_removal_metadata.sql
-- Persist removal reason, timestamp, and admin who removed the listing

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS removal_reason TEXT,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES profiles(id);
