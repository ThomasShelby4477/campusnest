-- 015: Allow users to update messages to mark them as read
-- Previously, there was no UPDATE policy on the messages table, so is_read was never updated.

CREATE POLICY "Match participants can update messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches
      WHERE id = match_id
        AND (user_a_id = auth.uid() OR user_b_id = auth.uid())
    )
  );
