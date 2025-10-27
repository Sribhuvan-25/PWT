-- Add deleted_at column to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions(deleted_at);
