-- Supabase Database Setup
-- https://app.supabase.com/project/_/sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  net_cents INTEGER NOT NULL,
  cashout_cents INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buy_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_members (
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_members_session_id ON members(session_id);
CREATE INDEX IF NOT EXISTS idx_results_session_id ON results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_member_id ON results(member_id);
CREATE INDEX IF NOT EXISTS idx_buy_ins_session_id ON buy_ins(session_id);
CREATE INDEX IF NOT EXISTS idx_buy_ins_member_id ON buy_ins(member_id);
CREATE INDEX IF NOT EXISTS idx_session_members_user_id ON session_members(user_id);
CREATE INDEX IF NOT EXISTS idx_session_members_session_id ON session_members(session_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;


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

CREATE POLICY "Anyone can read results"
  ON results FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create results"
  ON results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update results"
  ON results FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can read session members"
  ON session_members FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join sessions"
  ON session_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read buy-ins"
  ON buy_ins FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create buy-ins"
  ON buy_ins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update buy-ins"
  ON buy_ins FOR UPDATE
  USING (true);

-- Test queries (optional)
-- INSERT INTO sessions (name, join_code, date) VALUES ('Test Session', 'TEST123', '2024-01-01');
-- SELECT * FROM sessions;
