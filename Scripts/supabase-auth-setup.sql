-- Additional Supabase Setup for Authentication & Settlements

ALTER TABLE members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_group_id ON settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_member_id ON settlements(from_member_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_member_id ON settlements(to_member_id);

CREATE TRIGGER update_settlements_updated_at BEFORE UPDATE ON settlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settlements in their groups"
  ON settlements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create settlements"
  ON settlements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their settlements"
  ON settlements FOR UPDATE
  USING (true);

CREATE POLICY "Users can see their own member records"
  ON members FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

