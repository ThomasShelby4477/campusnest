-- Migration: Recalculate distance_from_college using correct NFSU Delhi campus coordinates
-- Old (wrong): 23.2156, 72.6369 (Gandhinagar, Gujarat)
-- New (correct): 28.696377, 77.109743 (NFSU Delhi campus)

UPDATE listings
SET distance_from_college = (
  6371 * acos(
    GREATEST(-1, LEAST(1,
      cos(radians(28.696377)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(77.109743)) +
      sin(radians(28.696377)) * sin(radians(latitude))
    ))
  )
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
