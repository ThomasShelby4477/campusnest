-- ============================================================
-- 028: Add subscription fields + payments table
-- ============================================================
-- Adds Pro subscription support to CampusNest.
-- Existing verified users receive a 30-day grace period.
-- ============================================================

-- ── Subscription columns on profiles ────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'FREE'
    CHECK (subscription_status IN ('FREE', 'PRO')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT NULL;

-- ── Payments ledger ─────────────────────────────────────────
-- Every Razorpay order + verification is recorded here.
-- Only the server (service role) can write; users can read own rows.
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,                -- in paise (₹199 = 19900)
  currency TEXT NOT NULL DEFAULT 'INR',
  plan TEXT NOT NULL,                     -- e.g. 'pro-semester'
  status TEXT NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'PAID', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

-- ── RLS on payments ─────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment history
CREATE POLICY "Users read own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated —
-- only the service-role key (supabaseAdmin) can write to this table.
-- This prevents client-side tampering with payment records.

-- ── Grace period: existing verified users get 30 days free Pro ──
UPDATE profiles
  SET subscription_status = 'PRO',
      subscription_expires_at = now() + interval '30 days',
      subscription_plan = 'grace-period'
  WHERE verified_status = 'VERIFIED'
    AND role != 'ADMIN'
    AND subscription_status = 'FREE';

-- ── Enable Realtime on payments (optional, for admin dashboard) ──
-- ALTER PUBLICATION supabase_realtime ADD TABLE payments;
