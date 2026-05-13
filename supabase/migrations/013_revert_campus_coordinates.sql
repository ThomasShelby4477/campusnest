-- Migration: Recalculate distance_from_college using correct NFSU Gandhinagar campus coordinates
-- Gandhinagar: 23.2156, 72.6369

UPDATE listings
SET distance_from_college = (
  6371 * acos(
    GREATEST(-1, LEAST(1,
      cos(radians(23.2156)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(72.6369)) +
      sin(radians(23.2156)) * sin(radians(latitude))
    ))
  )
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
