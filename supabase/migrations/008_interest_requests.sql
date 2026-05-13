-- 008_interest_requests.sql
-- Interest request system for privacy-preserving contact flow

-- ── interest_requests ───────────────────────────────────────
CREATE TABLE interest_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  poster_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','ACCEPTED','DECLINED')),
  message           TEXT CHECK (char_length(message) <= 500),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, requester_id)  -- one request per listing per user
);

CREATE INDEX idx_interest_requests_poster ON interest_requests(poster_id, status);
CREATE INDEX idx_interest_requests_requester ON interest_requests(requester_id, status);

-- Add INTEREST_REQUEST and INTEREST_ACCEPTED to notifications type check
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'NEW_MATCH','NEW_MESSAGE','VERIFICATION_APPROVED',
    'VERIFICATION_REJECTED','LISTING_APPROVED','REPORT_RESOLVED',
    'INTEREST_REQUEST','INTEREST_ACCEPTED','INTEREST_DECLINED'
  ));

-- Add LISTING chat_type to matches for listing-based chats
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_chat_type_check;
ALTER TABLE matches ADD CONSTRAINT matches_chat_type_check
  CHECK (chat_type IN ('ROOMMATE','BUDDY','LISTING'));

-- RLS policies for interest_requests
ALTER TABLE interest_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests (as requester or poster)
CREATE POLICY "Users can view own interest requests"
  ON interest_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = poster_id);

-- Authenticated users can create interest requests
CREATE POLICY "Users can create interest requests"
  ON interest_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Posters can update (accept/decline) requests sent to them
CREATE POLICY "Posters can update interest requests"
  ON interest_requests FOR UPDATE
  USING (auth.uid() = poster_id);
