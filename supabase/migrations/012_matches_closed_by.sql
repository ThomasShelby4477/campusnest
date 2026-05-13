-- 012_matches_closed_by.sql
-- Add closed_by to matches to track who closed the chat

ALTER TABLE matches ADD COLUMN closed_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
