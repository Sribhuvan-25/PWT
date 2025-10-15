-- Migration Script: Groups to Sessions
-- This script migrates the existing group-centric database to the new session-centric structure
-- Run this BEFORE running the test-data.sql script

-- ========================================
-- STEP 1: BACKUP EXISTING DATA
-- ========================================

-- Create backup tables (optional - uncomment if you want to keep backups)
-- CREATE TABLE groups_backup AS SELECT * FROM groups;
-- CREATE TABLE members_backup AS SELECT * FROM members;
-- CREATE TABLE sessions_backup AS SELECT * FROM sessions;
-- CREATE TABLE group_members_backup AS SELECT * FROM group_members;

-- ========================================
-- STEP 2: UPDATE SESSIONS TABLE
-- ========================================

-- Add new columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS join_code TEXT;

-- Update sessions with group names and generate join codes
UPDATE sessions 
SET 
  name = COALESCE(
    (SELECT g.name FROM groups g WHERE g.id = sessions.group_id),
    'Session ' || TO_CHAR(sessions.created_at, 'YYYY-MM-DD')
  ),
  join_code = UPPER(
    SUBSTRING(
      MD5(sessions.id::text || sessions.created_at::text), 
      1, 6
    )
  )
WHERE name IS NULL OR join_code IS NULL;

-- Make name and join_code NOT NULL
ALTER TABLE sessions ALTER COLUMN name SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN join_code SET NOT NULL;

-- Add unique constraint on join_code
ALTER TABLE sessions ADD CONSTRAINT sessions_join_code_unique UNIQUE (join_code);

-- ========================================
-- STEP 3: UPDATE MEMBERS TABLE
-- ========================================

-- Add session_id column to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS session_id UUID;

-- Update members to reference sessions instead of groups
-- For each member, find their first session in the group
UPDATE members 
SET session_id = (
  SELECT s.id 
  FROM sessions s 
  WHERE s.group_id = members.group_id 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE session_id IS NULL;

-- Handle members in groups with no sessions - create a default session for them
INSERT INTO sessions (id, name, join_code, date, note, status, created_at, updated_at)
SELECT 
  uuid_generate_v4() as id,
  g.name || ' - Default Session' as name,
  UPPER(SUBSTRING(MD5(g.id::text || g.created_at::text), 1, 6)) as join_code,
  COALESCE(g.created_at::date, CURRENT_DATE) as date,
  'Auto-created session for existing members' as note,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM groups g
WHERE NOT EXISTS (
  SELECT 1 FROM sessions s WHERE s.group_id = g.id
)
AND EXISTS (
  SELECT 1 FROM members m WHERE m.group_id = g.id
);

-- Now update any remaining members that still don't have a session_id
UPDATE members 
SET session_id = (
  SELECT s.id 
  FROM sessions s 
  WHERE s.group_id = members.group_id 
  ORDER BY s.created_at ASC 
  LIMIT 1
)
WHERE session_id IS NULL;

-- Check for any remaining NULL session_ids before making the column NOT NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM members WHERE session_id IS NULL) THEN
    RAISE EXCEPTION 'Some members still have NULL session_id. Check the data and fix manually.';
  END IF;
END $$;

-- Make session_id NOT NULL
ALTER TABLE members ALTER COLUMN session_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE members ADD CONSTRAINT members_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- ========================================
-- STEP 4: UPDATE SETTLEMENTS TABLE
-- ========================================

-- Add session_id column to settlements
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS session_id UUID;

-- Update settlements to reference sessions instead of groups
-- For each settlement, find the session that contains both members
UPDATE settlements 
SET session_id = (
  SELECT DISTINCT m1.session_id
  FROM members m1, members m2
  WHERE m1.id = settlements.from_member_id 
    AND m2.id = settlements.to_member_id
    AND m1.session_id = m2.session_id
  LIMIT 1
)
WHERE session_id IS NULL;

-- Make session_id NOT NULL
ALTER TABLE settlements ALTER COLUMN session_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE settlements ADD CONSTRAINT settlements_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- ========================================
-- STEP 5: CREATE SESSION_MEMBERS TABLE
-- ========================================

-- Create session_members table from group_members
CREATE TABLE IF NOT EXISTS session_members (
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, session_id)
);

-- Migrate group_members to session_members
-- For each group_member, assign them to the first session in their group
INSERT INTO session_members (user_id, session_id, role, joined_at)
SELECT 
  gm.user_id,
  s.id as session_id,
  gm.role,
  gm.joined_at
FROM group_members gm
JOIN groups g ON g.id = gm.group_id
JOIN sessions s ON s.group_id = g.id
WHERE NOT EXISTS (
  SELECT 1 FROM session_members sm 
  WHERE sm.user_id = gm.user_id 
    AND sm.session_id = s.id
);

-- Add foreign key constraint
ALTER TABLE session_members ADD CONSTRAINT session_members_session_id_fkey 
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- ========================================
-- STEP 6: UPDATE INDEXES
-- ========================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_members_groupId;
DROP INDEX IF EXISTS idx_sessions_groupId;
DROP INDEX IF EXISTS idx_settlements_groupId;
DROP INDEX IF EXISTS idx_group_members_userId;
DROP INDEX IF EXISTS idx_group_members_groupId;

-- Create new indexes
CREATE INDEX IF NOT EXISTS idx_sessions_join_code ON sessions(join_code);
CREATE INDEX IF NOT EXISTS idx_members_session_id ON members(session_id);
CREATE INDEX IF NOT EXISTS idx_settlements_session_id ON settlements(session_id);
CREATE INDEX IF NOT EXISTS idx_session_members_user_id ON session_members(user_id);
CREATE INDEX IF NOT EXISTS idx_session_members_session_id ON session_members(session_id);

-- ========================================
-- STEP 7: CLEAN UP OLD COLUMNS
-- ========================================

-- Remove old foreign key constraints
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_groupId_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_groupId_fkey;
ALTER TABLE settlements DROP CONSTRAINT IF EXISTS settlements_groupId_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_groupId_fkey;

-- Remove old columns
ALTER TABLE members DROP COLUMN IF EXISTS group_id;
ALTER TABLE sessions DROP COLUMN IF EXISTS group_id;
ALTER TABLE settlements DROP COLUMN IF EXISTS group_id;

-- ========================================
-- STEP 8: DROP OLD TABLES
-- ========================================

-- Drop old tables (uncomment when ready)
-- DROP TABLE IF EXISTS group_members;
-- DROP TABLE IF EXISTS groups;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify the migration worked
SELECT 'Sessions with names and join codes:' as check_type, COUNT(*) as count 
FROM sessions WHERE name IS NOT NULL AND join_code IS NOT NULL
UNION ALL
SELECT 'Members with session_id:', COUNT(*) 
FROM members WHERE session_id IS NOT NULL
UNION ALL
SELECT 'Settlements with session_id:', COUNT(*) 
FROM settlements WHERE session_id IS NOT NULL
UNION ALL
SELECT 'Session members:', COUNT(*) 
FROM session_members;

-- Show sample migrated data
SELECT 'Sample Sessions:' as info;
SELECT id, name, join_code, date, status FROM sessions LIMIT 3;

SELECT 'Sample Members:' as info;
SELECT m.id, m.name, s.name as session_name 
FROM members m 
JOIN sessions s ON s.id = m.session_id 
LIMIT 3;
