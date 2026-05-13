-- 010_block_messages_in_closed_chats.sql
-- Prevent inserting messages into permanently closed matches at the DB level.
-- This is server-enforced regardless of client-side UI state.

-- Drop the existing policy that allows sending without checking is_closed
DROP POLICY IF EXISTS "Match participants can send messages" ON messages;

-- Recreate with is_closed guard: INSERT blocked when match.is_closed = true
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
