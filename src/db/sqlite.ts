import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DROP_TABLES_SQL, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('poker-tracker.db');
    // Enable foreign key constraints
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await runMigrations(db);
    console.log('✅ SQLite database initialized');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const currentVersion = await getCurrentSchemaVersion(database);

    if (currentVersion === 0) {
      await database.execAsync(CREATE_TABLES_SQL);
      await setSchemaVersion(database, SCHEMA_VERSION);
      console.log(`📦 Database schema created (v${SCHEMA_VERSION})`);
    } else if (currentVersion < SCHEMA_VERSION) {
      await migrateDatabase(database, currentVersion, SCHEMA_VERSION);
      console.log(`🔄 Database migrated from v${currentVersion} to v${SCHEMA_VERSION}`);
    } else {
      // Check if all tables exist, if not recreate them
      const tables = await database.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const expectedTables = ['groups', 'members', 'sessions', 'results', 'buy_ins', 'group_members', 'settlements', 'app_metadata'];
      const existingTableNames = tables.map(t => t.name);
      const missingTables = expectedTables.filter(table => !existingTableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.log(`⚠️ Missing tables: ${missingTables.join(', ')}. Recreating schema...`);
        await database.execAsync(CREATE_TABLES_SQL);
        await setSchemaVersion(database, SCHEMA_VERSION);
        console.log(`📦 Database schema recreated (v${SCHEMA_VERSION})`);
      } else {
        console.log(`✓ Database schema up to date (v${SCHEMA_VERSION})`);
      }
    }
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
}

async function getCurrentSchemaVersion(database: SQLite.SQLiteDatabase): Promise<number> {
  try {
    const result = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      ['schema_version']
    );
    return result ? parseInt(result.value, 10) : 0;
  } catch (error) {
    return 0;
  }
}

async function setSchemaVersion(database: SQLite.SQLiteDatabase, version: number): Promise<void> {
  const now = new Date().toISOString();
  await database.runAsync(
    'INSERT OR REPLACE INTO app_metadata (key, value, updatedAt) VALUES (?, ?, ?)',
    ['schema_version', version.toString(), now]
  );
}

async function migrateDatabase(
  database: SQLite.SQLiteDatabase,
  fromVersion: number,
  toVersion: number
): Promise<void> {
  await setSchemaVersion(database, toVersion);
}

export async function resetDatabase(): Promise<void> {
  if (!db) {
    await initDatabase();
  }
  const database = getDatabase();

  await database.execAsync(DROP_TABLES_SQL);
  await database.execAsync(CREATE_TABLES_SQL);
  await setSchemaVersion(database, SCHEMA_VERSION);

  console.log('🔄 Database reset complete');
}

export async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  const database = getDatabase();
  return await database.getAllAsync<T>(sql, params || []);
}

export async function queryOne<T>(sql: string, params?: any[]): Promise<T | null> {
  const database = getDatabase();
  return await database.getFirstAsync<T>(sql, params || []);
}

export async function execute(sql: string, params?: any[]): Promise<SQLite.SQLiteRunResult> {
  const database = getDatabase();
  return await database.runAsync(sql, params || []);
}

export async function transaction(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
  const database = getDatabase();

  await database.withTransactionAsync(async () => {
    for (const stmt of statements) {
      await database.runAsync(stmt.sql, stmt.params || []);
    }
  });
}
