-- 022_add_listing_extra_fields.sql
-- Adds three new fields collected during listing creation:
--   persons_staying  — how many people currently live in the property
--   owner_proximity  — where the owner lives relative to the property
--   has_balcony      — whether the property has a balcony / open terrace

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS persons_staying  INT          DEFAULT 0,
  ADD COLUMN IF NOT EXISTS owner_proximity  TEXT         DEFAULT 'NEARBY'
    CHECK (owner_proximity IN ('SAME_BUILDING', 'NEARBY', 'FAR')),
  ADD COLUMN IF NOT EXISTS has_balcony      BOOLEAN      DEFAULT FALSE;
