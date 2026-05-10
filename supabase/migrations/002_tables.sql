-- 002_tables.sql
-- All tables for CampusNest

-- ── profiles ────────────────────────────────────────────────
CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT UNIQUE NOT NULL,
  phone             TEXT UNIQUE,
  name              TEXT,
  year              INT CHECK (year BETWEEN 1 AND 5),
  branch            TEXT,
  gender            TEXT CHECK (gender IN ('MALE','FEMALE','OTHER')),
  avatar_url        TEXT,
  student_id_path   TEXT,
  selfie_path       TEXT,
  verified_status   TEXT NOT NULL DEFAULT 'PARTIAL'
                    CHECK (verified_status IN ('PARTIAL','PENDING','VERIFIED','REJECTED')),
  verification_badge  BOOLEAN DEFAULT FALSE,
  role              TEXT NOT NULL DEFAULT 'STUDENT'
                    CHECK (role IN ('STUDENT','LANDLORD','ADMIN')),
  is_active         BOOLEAN DEFAULT TRUE,
  looking_for_buddy BOOLEAN DEFAULT FALSE,
  fcm_token         TEXT,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── user_preferences ────────────────────────────────────────
CREATE TABLE user_preferences (
  user_id        UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  budget_min     INT,
  budget_max     INT,
  sleep_schedule TEXT CHECK (sleep_schedule IN ('EARLY_BIRD','NIGHT_OWL','FLEXIBLE')),
  cleanliness    INT CHECK (cleanliness BETWEEN 1 AND 5),
  smoking        BOOLEAN,
  drinking       BOOLEAN,
  guests_policy  TEXT CHECK (guests_policy IN ('RARELY','SOMETIMES','OFTEN')),
  study_env      TEXT CHECK (study_env IN ('SILENT','LIGHT_NOISE','NOISY')),
  gaming         BOOLEAN,
  food_pref      TEXT CHECK (food_pref IN ('VEG','NON_VEG','EGGETARIAN','ANY')),
  personality    TEXT CHECK (personality IN ('INTROVERT','EXTROVERT','AMBIVERT')),
  gender_pref    TEXT CHECK (gender_pref IN ('MALE','FEMALE','ANY')),
  move_in_date   DATE,
  quiz_completed BOOLEAN DEFAULT FALSE,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── listings ────────────────────────────────────────────────
CREATE TABLE listings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT CHECK (char_length(description) <= 1000),
  rent                  INT NOT NULL,
  deposit               INT NOT NULL,
  room_type             TEXT CHECK (room_type IN ('SINGLE','SHARED','1BHK','2BHK','3BHK','PG')),
  furnished             TEXT CHECK (furnished IN ('FURNISHED','SEMI','UNFURNISHED')),
  gender_allowed        TEXT CHECK (gender_allowed IN ('MALE','FEMALE','ANY')),
  roommates_needed      INT DEFAULT 1,
  has_wifi              BOOLEAN DEFAULT FALSE,
  has_ac                BOOLEAN DEFAULT FALSE,
  food_available        BOOLEAN DEFAULT FALSE,
  water_supply          TEXT CHECK (water_supply IN ('24H','TIMED','BOREWELL')),
  latitude              FLOAT NOT NULL,
  longitude             FLOAT NOT NULL,
  address               TEXT NOT NULL,
  distance_from_college FLOAT,
  available_from        DATE,
  is_active             BOOLEAN DEFAULT TRUE,
  is_verified           BOOLEAN DEFAULT FALSE,
  views                 INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── listing_images ──────────────────────────────────────────
CREATE TABLE listing_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  "order"    INT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE
);

-- ── roommate_likes ──────────────────────────────────────────
CREATE TABLE roommate_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(liker_id, liked_id),
  CHECK (liker_id != liked_id)
);

-- ── matches ─────────────────────────────────────────────────
CREATE TABLE matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_type  TEXT DEFAULT 'ROOMMATE' CHECK (chat_type IN ('ROOMMATE','BUDDY')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id),
  CHECK (user_a_id < user_b_id)
);

-- ── messages ────────────────────────────────────────────────
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── saved_listings ──────────────────────────────────────────
CREATE TABLE saved_listings (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- ── reports ─────────────────────────────────────────────────
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('USER','LISTING')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL CHECK (reason IN (
                'FAKE_LISTING','SCAM','HARASSMENT','SPAM','DISCRIMINATION','OTHER')),
  description TEXT,
  status      TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWING','RESOLVED','DISMISSED')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── notifications ───────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'NEW_MATCH','NEW_MESSAGE','VERIFICATION_APPROVED',
               'VERIFICATION_REJECTED','LISTING_APPROVED','REPORT_RESOLVED')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── audit_logs ──────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── consent_records ─────────────────────────────────────────
CREATE TABLE consent_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL,
  consented_at   TIMESTAMPTZ DEFAULT NOW(),
  ip_address     TEXT
);

-- ── public_profiles view ────────────────────────────────────
CREATE VIEW public_profiles AS
  SELECT id, name, avatar_url, year, branch,
         verified_status, verification_badge,
         looking_for_buddy, gender
  FROM profiles
  WHERE is_active = TRUE;
