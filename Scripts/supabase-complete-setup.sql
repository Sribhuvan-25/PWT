-- ========================================
-- COMPLETE SUPABASE DATABASE SETUP
-- ========================================
-- This script creates the complete database schema with all features
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql
--
-- Features included:
-- - Sessions and members management
-- - Buy-ins and results tracking
-- - Settlements with paid status
-- - Soft delete support
-- - Push notification tokens
-- - Manual adjustments for stats
-- - Buy-in approval workflow
-- - Row Level Security (RLS) policies
--
-- Last updated: 2025-10-27
-- ========================================

-- ========================================
-- STEP 1: CLEAN UP (if needed)
-- ========================================

-- Uncomment the following lines to completely reset your database
-- WARNING: This will delete ALL data!
/*
DROP TABLE IF EXISTS push_tokens CASCADE;
DROP TABLE IF EXISTS manual_adjustments CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS buy_ins CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS session_members CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
*/

-- ========================================
-- STEP 2: ENABLE EXTENSIONS
-- ========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- STEP 3: CREATE TABLES
-- ========================================

-- Sessions table (main entity - poker games/sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
  deleted_at TIMESTAMPTZ,  -- Soft delete support
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Members table (players in sessions)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),  -- Link to authenticated users
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Results table (final cashout amounts and net results)
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  net_cents INTEGER NOT NULL,
  cashout_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Buy-ins table (tracks multiple buy-ins per member per session)
CREATE TABLE IF NOT EXISTS buy_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  approved BOOLEAN DEFAULT false,  -- Buy-in approval workflow
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Session Members table (for multi-user support - who can access which sessions)
CREATE TABLE IF NOT EXISTS session_members (
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

-- Settlements table (track debt payments between members)
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  paid BOOLEAN DEFAULT false,  -- Payment tracking
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Manual Adjustments table (for manual stats corrections)
CREATE TABLE IF NOT EXISTS manual_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,  -- Can be positive or negative
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Tokens table (for push notifications)
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, token)
);

-- ========================================
-- STEP 4: CREATE INDEXES
-- ========================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_sessions_pending_sync ON sessions(pending_sync);

-- Members indexes
CREATE INDEX IF NOT EXISTS idx_members_session_id ON members(session_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_pending_sync ON members(pending_sync);

-- Results indexes
CREATE INDEX IF NOT EXISTS idx_results_session_id ON results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_member_id ON results(member_id);
CREATE INDEX IF NOT EXISTS idx_results_pending_sync ON results(pending_sync);

-- Buy-ins indexes
CREATE INDEX IF NOT EXISTS idx_buy_ins_session_id ON buy_ins(session_id);
CREATE INDEX IF NOT EXISTS idx_buy_ins_member_id ON buy_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_buy_ins_approved ON buy_ins(approved);
CREATE INDEX IF NOT EXISTS idx_buy_ins_pending_sync ON buy_ins(pending_sync);

-- Session members indexes
CREATE INDEX IF NOT EXISTS idx_session_members_user_id ON session_members(user_id);
CREATE INDEX IF NOT EXISTS idx_session_members_session_id ON session_members(session_id);

-- Settlements indexes
CREATE INDEX IF NOT EXISTS idx_settlements_session_id ON settlements(session_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_member_id ON settlements(from_member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_member_id ON settlements(to_member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_paid ON settlements(paid);
CREATE INDEX IF NOT EXISTS idx_settlements_paid_at ON settlements(paid_at);
CREATE INDEX IF NOT EXISTS idx_settlements_pending_sync ON settlements(pending_sync);

-- Manual adjustments indexes
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_user_id ON manual_adjustments(user_id);

-- Push tokens indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- ========================================
-- STEP 5: CREATE TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at on various tables
DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_results_updated_at ON results;
CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settlements_updated_at ON settlements;
CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Manual adjustments updated_at trigger
CREATE OR REPLACE FUNCTION update_manual_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manual_adjustments_updated_at ON manual_adjustments;
CREATE TRIGGER manual_adjustments_updated_at BEFORE UPDATE ON manual_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_manual_adjustments_updated_at();

-- Push tokens updated_at trigger
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_tokens_updated_at ON push_tokens;
CREATE TRIGGER push_tokens_updated_at BEFORE UPDATE ON push_tokens
  FOR EACH ROW EXECUTE FUNCTION update_push_tokens_updated_at();

-- ========================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 7: CREATE RLS POLICIES
-- ========================================

-- Sessions policies
DROP POLICY IF EXISTS "Anyone can read sessions by join code" ON sessions;
CREATE POLICY "Anyone can read sessions by join code"
  ON sessions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create sessions" ON sessions;
CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Session admins can update sessions" ON sessions;
CREATE POLICY "Session admins can update sessions"
  ON sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM session_members
      WHERE session_members.session_id = sessions.id
      AND session_members.role = 'admin'
    )
  );

-- Members policies
DROP POLICY IF EXISTS "Anyone can read members in their sessions" ON members;
DROP POLICY IF EXISTS "Session members can see all members in their sessions" ON members;
CREATE POLICY "Session members can see all members in their sessions"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_members
      WHERE session_members.session_id = members.session_id
      AND session_members.user_id = auth.uid()
    )
    OR user_id IS NULL
  );

DROP POLICY IF EXISTS "Anyone can create members" ON members;
CREATE POLICY "Anyone can create members"
  ON members FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Session members can update members" ON members;
CREATE POLICY "Session members can update members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM session_members
      WHERE session_members.session_id = members.session_id
    )
  );

-- Results policies
DROP POLICY IF EXISTS "Anyone can read results" ON results;
CREATE POLICY "Anyone can read results"
  ON results FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create results" ON results;
CREATE POLICY "Anyone can create results"
  ON results FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update results" ON results;
CREATE POLICY "Anyone can update results"
  ON results FOR UPDATE
  USING (true);

-- Buy-ins policies
DROP POLICY IF EXISTS "Anyone can read buy-ins" ON buy_ins;
CREATE POLICY "Anyone can read buy-ins"
  ON buy_ins FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create buy-ins" ON buy_ins;
CREATE POLICY "Anyone can create buy-ins"
  ON buy_ins FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update buy-ins" ON buy_ins;
DROP POLICY IF EXISTS "Session admins can approve buy-ins" ON buy_ins;
CREATE POLICY "Session admins can approve buy-ins"
  ON buy_ins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = buy_ins.session_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
    )
  );

-- Session members policies
DROP POLICY IF EXISTS "Anyone can read session members" ON session_members;
CREATE POLICY "Anyone can read session members"
  ON session_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can join sessions" ON session_members;
CREATE POLICY "Anyone can join sessions"
  ON session_members FOR INSERT
  WITH CHECK (true);

-- Settlements policies
DROP POLICY IF EXISTS "Anyone can read settlements" ON settlements;
DROP POLICY IF EXISTS "Anyone can read settlements in their sessions" ON settlements;
CREATE POLICY "Anyone can read settlements in their sessions"
  ON settlements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create settlements" ON settlements;
CREATE POLICY "Anyone can create settlements"
  ON settlements FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update settlements" ON settlements;
DROP POLICY IF EXISTS "Anyone can update their settlements" ON settlements;
CREATE POLICY "Anyone can update their settlements"
  ON settlements FOR UPDATE
  USING (true);

-- Manual adjustments policies
DROP POLICY IF EXISTS "Users can view own adjustments" ON manual_adjustments;
CREATE POLICY "Users can view own adjustments"
  ON manual_adjustments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own adjustments" ON manual_adjustments;
CREATE POLICY "Users can insert own adjustments"
  ON manual_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own adjustments" ON manual_adjustments;
CREATE POLICY "Users can delete own adjustments"
  ON manual_adjustments FOR DELETE
  USING (auth.uid() = user_id);

-- Push tokens policies
DROP POLICY IF EXISTS "Users can view own tokens" ON push_tokens;
CREATE POLICY "Users can view own tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON push_tokens;
CREATE POLICY "Users can insert own tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON push_tokens;
CREATE POLICY "Users can update own tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tokens" ON push_tokens;
CREATE POLICY "Users can delete own tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- STEP 8: ADD COMMENTS
-- ========================================

COMMENT ON TABLE sessions IS 'Poker game sessions';
COMMENT ON TABLE members IS 'Players participating in sessions';
COMMENT ON TABLE results IS 'Final results and cashouts for members';
COMMENT ON TABLE buy_ins IS 'Buy-in transactions for members';
COMMENT ON TABLE session_members IS 'User access control for sessions';
COMMENT ON TABLE settlements IS 'Debt settlements between members';
COMMENT ON TABLE manual_adjustments IS 'Manual adjustments for user stats';
COMMENT ON TABLE push_tokens IS 'Stores Expo push notification tokens for users';

COMMENT ON COLUMN sessions.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN buy_ins.approved IS 'Whether the buy-in has been approved by an admin';
COMMENT ON COLUMN settlements.paid IS 'Whether the settlement has been paid';
COMMENT ON COLUMN settlements.paid_at IS 'When the settlement was marked as paid';
COMMENT ON COLUMN settlements.paid_by IS 'User who marked the settlement as paid';
COMMENT ON COLUMN push_tokens.user_id IS 'User who owns this push token';
COMMENT ON COLUMN push_tokens.token IS 'Expo push token';
COMMENT ON COLUMN push_tokens.platform IS 'Device platform (ios, android, web)';
COMMENT ON COLUMN push_tokens.last_used_at IS 'Last time this token was used to send a notification';

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 'Database setup complete!' as status;

-- Show created tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
