-- Create push_tokens table to store user notification tokens

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

-- Add index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);

-- Add index for token lookups
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view own tokens"
  ON push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own tokens"
  ON push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own tokens"
  ON push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_updated_at();

-- Add comments
COMMENT ON TABLE push_tokens IS 'Stores Expo push notification tokens for users';
COMMENT ON COLUMN push_tokens.user_id IS 'User who owns this push token';
COMMENT ON COLUMN push_tokens.token IS 'Expo push token';
COMMENT ON COLUMN push_tokens.platform IS 'Device platform (ios, android, web)';
COMMENT ON COLUMN push_tokens.last_used_at IS 'Last time this token was used to send a notification';
