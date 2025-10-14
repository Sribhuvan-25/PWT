import { query, queryOne, execute, transaction } from '../sqlite';
import { Result, MemberBalance } from '@/types';
import * as Crypto from 'expo-crypto';

export async function createResult(
  sessionId: string,
  memberId: string,
  netCents: number
): Promise<Result> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO results (id, sessionId, memberId, netCents, updatedAt, pendingSync) VALUES (?, ?, ?, ?, ?, ?)',
    [id, sessionId, memberId, netCents, now, 1]
  );

  return {
    id,
    sessionId,
    memberId,
    netCents,
    updatedAt: now,
    pendingSync: 1,
  };
}

export async function createResults(
  results: Array<{ sessionId: string; memberId: string; netCents: number }>
): Promise<void> {
  const now = new Date().toISOString();
  const statements = results.map((result) => ({
    sql: 'INSERT INTO results (id, sessionId, memberId, netCents, updatedAt, pendingSync) VALUES (?, ?, ?, ?, ?, ?)',
    params: [Crypto.randomUUID(), result.sessionId, result.memberId, result.netCents, now, 1],
  }));

  await transaction(statements);
}

export async function getResultsBySessionId(sessionId: string): Promise<Result[]> {
  return await query<Result>(
    'SELECT * FROM results WHERE sessionId = ? ORDER BY netCents DESC',
    [sessionId]
  );
}

export async function getResultById(id: string): Promise<Result | null> {
  return await queryOne<Result>('SELECT * FROM results WHERE id = ?', [id]);
}

export async function updateResult(id: string, netCents: number): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    'UPDATE results SET netCents = ?, updatedAt = ?, pendingSync = 1 WHERE id = ?',
    [netCents, now, id]
  );
}

export async function deleteResult(id: string): Promise<void> {
  await execute('DELETE FROM results WHERE id = ?', [id]);
}

export async function getResultsPendingSync(): Promise<Result[]> {
  return await query<Result>('SELECT * FROM results WHERE pendingSync = 1');
}

export async function markResultSynced(id: string): Promise<void> {
  await execute('UPDATE results SET pendingSync = 0 WHERE id = ?', [id]);
}

export async function upsertResult(result: Result): Promise<void> {
  await execute(
    `INSERT INTO results (id, sessionId, memberId, netCents, updatedAt, pendingSync)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       sessionId = excluded.sessionId,
       memberId = excluded.memberId,
       netCents = excluded.netCents,
       updatedAt = excluded.updatedAt,
       pendingSync = 0`,
    [result.id, result.sessionId, result.memberId, result.netCents, result.updatedAt]
  );
}

export async function calculateMemberBalances(groupId: string): Promise<MemberBalance[]> {
  const sql = `
    SELECT
      m.id as memberId,
      m.name as memberName,
      COALESCE(SUM(r.netCents), 0) as totalCents
    FROM members m
    LEFT JOIN results r ON r.memberId = m.id
    LEFT JOIN sessions s ON s.id = r.sessionId
    WHERE m.groupId = ?
    GROUP BY m.id, m.name
    ORDER BY totalCents DESC
  `;

  return await query<MemberBalance>(sql, [groupId]);
}

export async function getResultsByMemberId(memberId: string): Promise<Result[]> {
  return await query<Result>(
    `SELECT r.* FROM results r
     JOIN sessions s ON s.id = r.sessionId
     WHERE r.memberId = ?
     ORDER BY s.date DESC`,
    [memberId]
  );
}
