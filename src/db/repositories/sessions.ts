import { query, queryOne, execute } from '../sqlite';
import { Session } from '@/types';
import * as Crypto from 'expo-crypto';

export async function createSession(
  groupId: string,
  date: string,
  note?: string
): Promise<Session> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO sessions (id, groupId, date, note, createdAt, updatedAt, pendingSync) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, groupId, date, note || null, now, now, 1]
  );

  return {
    id,
    groupId,
    date,
    note,
    createdAt: now,
    updatedAt: now,
    pendingSync: 1,
  };
}

export async function getSessionsByGroupId(groupId: string): Promise<Session[]> {
  return await query<Session>(
    'SELECT * FROM sessions WHERE groupId = ? ORDER BY date DESC, createdAt DESC',
    [groupId]
  );
}

export async function getSessionById(id: string): Promise<Session | null> {
  return await queryOne<Session>('SELECT * FROM sessions WHERE id = ?', [id]);
}

export async function updateSession(
  id: string,
  date: string,
  note?: string
): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    'UPDATE sessions SET date = ?, note = ?, updatedAt = ?, pendingSync = 1 WHERE id = ?',
    [date, note || null, now, id]
  );
}

export async function deleteSession(id: string): Promise<void> {
  await execute('DELETE FROM sessions WHERE id = ?', [id]);
}

export async function getSessionsPendingSync(): Promise<Session[]> {
  return await query<Session>('SELECT * FROM sessions WHERE pendingSync = 1');
}

export async function markSessionSynced(id: string): Promise<void> {
  await execute('UPDATE sessions SET pendingSync = 0 WHERE id = ?', [id]);
}

export async function upsertSession(session: Session): Promise<void> {
  await execute(
    `INSERT INTO sessions (id, groupId, date, note, createdAt, updatedAt, pendingSync)
     VALUES (?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       groupId = excluded.groupId,
       date = excluded.date,
       note = excluded.note,
       updatedAt = excluded.updatedAt,
       pendingSync = 0`,
    [session.id, session.groupId, session.date, session.note, session.createdAt, session.updatedAt]
  );
}
