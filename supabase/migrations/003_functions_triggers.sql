-- 003_functions_triggers.sql
-- All triggers and functions for CampusNest

-- ── Auto-create profile on auth.users signup ────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Auto-compute distance from NFSU campus ─────────────────
-- Campus coords: lat=23.2156, lng=72.6369
CREATE OR REPLACE FUNCTION compute_distance_from_campus()
RETURNS TRIGGER AS $$
DECLARE
  campus_lat FLOAT := 23.2156;
  campus_lng FLOAT := 72.6369;
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

CREATE TRIGGER set_distance
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON listings
  FOR EACH ROW EXECUTE FUNCTION compute_distance_from_campus();

-- ── Increment listing views via RPC ─────────────────────────
CREATE OR REPLACE FUNCTION increment_views(listing_id UUID)
RETURNS VOID AS $$
  UPDATE listings SET views = views + 1 WHERE id = listing_id;
$$ LANGUAGE sql;

-- ── Auto-create match on mutual like ────────────────────────
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM roommate_likes
    WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id
  ) THEN
    INSERT INTO matches (user_a_id, user_b_id)
    VALUES (
      LEAST(NEW.liker_id, NEW.liked_id),
      GREATEST(NEW.liker_id, NEW.liked_id)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_inserted
  AFTER INSERT ON roommate_likes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

-- ── Auto-update updated_at on profiles ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
