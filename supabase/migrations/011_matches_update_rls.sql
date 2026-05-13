-- 011_matches_update_rls.sql
-- Add UPDATE policy to matches table so participants can set is_closed to true.

CREATE POLICY "Match participants can update matches"
  ON matches FOR UPDATE
  USING (user_a_id = auth.uid() OR user_b_id = auth.uid());
