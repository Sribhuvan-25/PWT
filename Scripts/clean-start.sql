-- Clean Start Script: Delete All Tables and Create New Session-Centric Schema
-- This script will completely reset your database to the new structure

-- ========================================
-- STEP 1: DELETE ALL EXISTING TABLES
-- ========================================

-- Drop all tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS buy_ins CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS session_members CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- Drop any remaining sequences or functions if they exist
DROP SEQUENCE IF EXISTS groups_id_seq CASCADE;
DROP SEQUENCE IF EXISTS members_id_seq CASCADE;
DROP SEQUENCE IF EXISTS sessions_id_seq CASCADE;
DROP SEQUENCE IF EXISTS results_id_seq CASCADE;
DROP SEQUENCE IF EXISTS buy_ins_id_seq CASCADE;
DROP SEQUENCE IF EXISTS settlements_id_seq CASCADE;

-- ========================================
-- STEP 2: CREATE NEW SESSION-CENTRIC SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (now standalone with name and join code)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Members table (now tied to sessions)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Results table (stores final cashout amounts)
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  net_cents INTEGER NOT NULL,
  cashout_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Buy-ins table (tracks multiple buy-ins per member per session)
CREATE TABLE buy_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);

-- Session Members table (for multi-user support)
CREATE TABLE session_members (
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

-- Settlements table (track debt payments)
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pending_sync INTEGER DEFAULT 0
);


-- ========================================
-- STEP 3: CREATE INDEXES
-- ========================================

-- Sessions indexes
CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_pending_sync ON sessions(pending_sync);

-- Members indexes
CREATE INDEX idx_members_session_id ON members(session_id);
CREATE INDEX idx_members_pending_sync ON members(pending_sync);

-- Results indexes
CREATE INDEX idx_results_session_id ON results(session_id);
CREATE INDEX idx_results_member_id ON results(member_id);
CREATE INDEX idx_results_pending_sync ON results(pending_sync);

-- Buy-ins indexes
CREATE INDEX idx_buy_ins_session_id ON buy_ins(session_id);
CREATE INDEX idx_buy_ins_member_id ON buy_ins(member_id);
CREATE INDEX idx_buy_ins_pending_sync ON buy_ins(pending_sync);

-- Session members indexes
CREATE INDEX idx_session_members_user_id ON session_members(user_id);
CREATE INDEX idx_session_members_session_id ON session_members(session_id);

-- Settlements indexes
CREATE INDEX idx_settlements_session_id ON settlements(session_id);
CREATE INDEX idx_settlements_from_member_id ON settlements(from_member_id);
CREATE INDEX idx_settlements_to_member_id ON settlements(to_member_id);
CREATE INDEX idx_settlements_pending_sync ON settlements(pending_sync);

-- ========================================
-- STEP 4: CREATE TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ========================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 6: CREATE POLICIES
-- ========================================

-- Sessions policies
CREATE POLICY "Anyone can read sessions by join code"
  ON sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (true);

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
CREATE POLICY "Anyone can read members in their sessions"
  ON members FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create members"
  ON members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Session members can update members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM session_members
      WHERE session_members.session_id = members.session_id
    )
  );

-- Results policies
CREATE POLICY "Anyone can read results"
  ON results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create results"
  ON results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update results"
  ON results FOR UPDATE
  USING (true);

-- Buy-ins policies
CREATE POLICY "Anyone can read buy-ins"
  ON buy_ins FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create buy-ins"
  ON buy_ins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update buy-ins"
  ON buy_ins FOR UPDATE
  USING (true);

-- Session members policies
CREATE POLICY "Anyone can read session members"
  ON session_members FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join sessions"
  ON session_members FOR INSERT
  WITH CHECK (true);

-- Settlements policies
CREATE POLICY "Anyone can read settlements"
  ON settlements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create settlements"
  ON settlements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update settlements"
  ON settlements FOR UPDATE
  USING (true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify tables were created
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
