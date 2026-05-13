-- 009_matches_close.sql
-- Add is_closed flag to matches for permanently closing chats

ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE;
