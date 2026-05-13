-- 014: Allow users to read profiles of people they are in a match with
-- This is needed so chat lists and chat pages can show the other user's name and avatar.

CREATE POLICY "Match participants can read each other's profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM matches
      WHERE (user_a_id = auth.uid() AND user_b_id = id)
         OR (user_b_id = auth.uid() AND user_a_id = id)
    )
  );

-- Also allow reading profiles of interest request senders/receivers
CREATE POLICY "Interest request participants can read each other's profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM interest_requests
      WHERE (sender_id = auth.uid() AND receiver_id = id)
         OR (receiver_id = auth.uid() AND sender_id = id)
    )
  );
