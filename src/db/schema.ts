// SQLite Schema Definitions

export const SCHEMA_VERSION = 4

export const CREATE_TABLES_SQL = `
  -- Sessions table (now standalone)
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    joinCode TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_joinCode ON sessions(joinCode);
  CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
  CREATE INDEX IF NOT EXISTS idx_sessions_pendingSync ON sessions(pendingSync);

  -- Members table (now tied to sessions)
  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY NOT NULL,
    sessionId TEXT NOT NULL,
    name TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_members_sessionId ON members(sessionId);
  CREATE INDEX IF NOT EXISTS idx_members_pendingSync ON members(pendingSync);

  -- Results table (stores final cashout amounts)
  CREATE TABLE IF NOT EXISTS results (
    id TEXT PRIMARY KEY NOT NULL,
    sessionId TEXT NOT NULL,
    memberId TEXT NOT NULL,
    netCents INTEGER NOT NULL,
    cashoutCents INTEGER DEFAULT 0,
    updatedAt TEXT NOT NULL,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_results_sessionId ON results(sessionId);
  CREATE INDEX IF NOT EXISTS idx_results_memberId ON results(memberId);
  CREATE INDEX IF NOT EXISTS idx_results_pendingSync ON results(pendingSync);

  -- Buy-ins table (tracks multiple buy-ins per member per session)
  CREATE TABLE IF NOT EXISTS buy_ins (
    id TEXT PRIMARY KEY NOT NULL,
    sessionId TEXT NOT NULL,
    memberId TEXT NOT NULL,
    amountCents INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_buy_ins_sessionId ON buy_ins(sessionId);
  CREATE INDEX IF NOT EXISTS idx_buy_ins_memberId ON buy_ins(memberId);
  CREATE INDEX IF NOT EXISTS idx_buy_ins_pendingSync ON buy_ins(pendingSync);

  -- Session Members table (for multi-user support)
  CREATE TABLE IF NOT EXISTS session_members (
    userId TEXT NOT NULL,
    sessionId TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'member')),
    joinedAt TEXT NOT NULL,
    PRIMARY KEY (userId, sessionId),
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_session_members_userId ON session_members(userId);
  CREATE INDEX IF NOT EXISTS idx_session_members_sessionId ON session_members(sessionId);

  -- Settlements table (track debt payments)
  CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY NOT NULL,
    sessionId TEXT NOT NULL,
    fromMemberId TEXT NOT NULL,
    toMemberId TEXT NOT NULL,
    amountCents INTEGER NOT NULL,
    settledAt TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT,
    pendingSync INTEGER DEFAULT 0,
    FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (fromMemberId) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (toMemberId) REFERENCES members(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_settlements_sessionId ON settlements(sessionId);
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
  DROP TABLE IF EXISTS buy_ins;
  DROP TABLE IF EXISTS results;
  DROP TABLE IF EXISTS members;
  DROP TABLE IF EXISTS session_members;
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS app_metadata;
`;
