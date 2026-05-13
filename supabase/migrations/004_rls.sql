-- 004_rls.sql
-- Row Level Security policies for all tables

-- ── profiles ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── listings ────────────────────────────────────────────────
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active verified listings"
  ON listings FOR SELECT
  USING (is_active = TRUE AND is_verified = TRUE);

CREATE POLICY "Owner can read own listings"
  ON listings FOR SELECT USING (poster_id = auth.uid());

CREATE POLICY "Verified users can insert listings"
  ON listings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND verified_status = 'VERIFIED'
    )
  );

CREATE POLICY "Owner can update own listings"
  ON listings FOR UPDATE USING (poster_id = auth.uid());

CREATE POLICY "Owner can delete own listings"
  ON listings FOR DELETE USING (poster_id = auth.uid());

-- ── listing_images ──────────────────────────────────────────
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read listing images"
  ON listing_images FOR SELECT USING (TRUE);

CREATE POLICY "Listing owner can manage images"
  ON listing_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id AND poster_id = auth.uid()
    )
  );

-- ── roommate_likes ──────────────────────────────────────────
ALTER TABLE roommate_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own likes"
  ON roommate_likes FOR SELECT
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

CREATE POLICY "Verified users can like"
  ON roommate_likes FOR INSERT
  WITH CHECK (
    liker_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND verified_status = 'VERIFIED'
    )
  );

-- ── matches ─────────────────────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see own matches"
  ON matches FOR SELECT
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

CREATE POLICY "Match participants can update matches"
  ON matches FOR UPDATE
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());

-- ── messages ────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match participants can read messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  );

CREATE POLICY "Match participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
        AND (is_closed IS NULL OR is_closed = FALSE)
    )
  );

-- ── saved_listings ──────────────────────────────────────────
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved listings"
  ON saved_listings FOR ALL USING (user_id = auth.uid());

-- ── notifications ───────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- ── user_preferences ────────────────────────────────────────
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences"
  ON user_preferences FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE USING (user_id = auth.uid());

-- ── reports (admin-only via service role) ────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert reports"
  ON reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- ── audit_logs (admin-only via service role) ─────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── consent_records ─────────────────────────────────────────
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own consent"
  ON consent_records FOR INSERT WITH CHECK (user_id = auth.uid());
