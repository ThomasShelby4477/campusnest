-- 016_update_campus_coordinates_delhi.sql
-- Update the campus coordinates to the Delhi campus: 28.696385, 77.109666

-- 1. Update the trigger function used for new/updated listings
CREATE OR REPLACE FUNCTION compute_distance_from_campus()
RETURNS TRIGGER AS $$
DECLARE
  campus_lat FLOAT := 28.696385;
  campus_lng FLOAT := 77.109666;
  R          FLOAT := 6371;
  dlat FLOAT; dlng FLOAT; a FLOAT;
BEGIN
  dlat := RADIANS(NEW.latitude  - campus_lat);
  dlng := RADIANS(NEW.longitude - campus_lng);
  a := SIN(dlat/2)^2 +
       COS(RADIANS(campus_lat)) * COS(RADIANS(NEW.latitude)) *
       SIN(dlng/2)^2;
  NEW.distance_from_college := R * 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recalculate distance_from_college for all existing listings
UPDATE listings
SET distance_from_college = (
  6371 * acos(
    GREATEST(-1, LEAST(1,
      cos(radians(28.696385)) * cos(radians(latitude)) *
      cos(radians(longitude) - radians(77.109666)) +
      sin(radians(28.696385)) * sin(radians(latitude))
    ))
  )
)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
