// SQLite Schema Definitions

export const SCHEMA_VERSION = 2

export const CREATE_TABLES_SQL = `
  -- Groups table
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    joinCode TEXT UNIQUE NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_groups_joinCode ON groups(joinCode);
  CREATE INDEX IF NOT EXISTS idx_groups_pendingSync ON groups(pendingSync);

  -- Members table
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY NOT NULL,
    groupId TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_members_groupId ON members(groupId);
  CREATE INDEX IF NOT EXISTS idx_members_pendingSync ON members(pendingSync);

  -- Sessions table
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    groupId TEXT NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_groupId ON sessions(groupId);
  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_sessions_pendingSync ON sessions(pendingSync);

  -- Results table
  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY NOT NULL,
    sessionId TEXT NOT NULL,
    memberId TEXT NOT NULL,
    netCents INTEGER NOT NULL,
    updatedAt TEXT NOT NULL,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_results_sessionId ON results(sessionId);
  CREATE INDEX IF NOT EXISTS idx_results_memberId ON results(memberId);
  CREATE INDEX IF NOT EXISTS idx_results_pendingSync ON results(pendingSync);

  -- Group Members table (for multi-user support)
  CREATE TABLE IF NOT EXISTS group_members (
    userId TEXT NOT NULL,
    groupId TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
    joinedAt TEXT NOT NULL,
    PRIMARY KEY (userId, groupId),
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_group_members_userId ON group_members(userId);
  CREATE INDEX IF NOT EXISTS idx_group_members_groupId ON group_members(groupId);

  -- Settlements table (track debt payments)
  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY NOT NULL,
    groupId TEXT NOT NULL,
    fromMemberId TEXT NOT NULL,
    toMemberId TEXT NOT NULL,
    amountCents INTEGER NOT NULL,
    settledAt TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (fromMemberId) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (toMemberId) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_settlements_groupId ON settlements(groupId);
  CREATE INDEX IF NOT EXISTS idx_settlements_fromMemberId ON settlements(fromMemberId);
  CREATE INDEX IF NOT EXISTS idx_settlements_toMemberId ON settlements(toMemberId);
  CREATE INDEX IF NOT EXISTS idx_settlements_pendingSync ON settlements(pendingSync);

  -- Metadata table for app state
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`;

export const DROP_TABLES_SQL = `
  DROP TABLE IF EXISTS settlements;
  DROP TABLE IF EXISTS results;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS members;
  DROP TABLE IF EXISTS group_members;
  DROP TABLE IF EXISTS groups;
  DROP TABLE IF EXISTS app_metadata;
`;
