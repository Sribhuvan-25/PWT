import { query, queryOne, execute } from '../sqlite';
import { Settlement } from '@/types';
import * as Crypto from 'expo-crypto';

export async function createSettlement(
  groupId: string,
  fromMemberId: string,
  toMemberId: string,
  amountCents: number,
  note?: string
): Promise<Settlement> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO settlements (id, groupId, fromMemberId, toMemberId, amountCents, settledAt, note, createdAt, updatedAt, pendingSync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, groupId, fromMemberId, toMemberId, amountCents, now, note || null, now, now, 1]
  );

  return {
    id,
    groupId,
    fromMemberId,
    toMemberId,
    amountCents,
    settledAt: now,
    note,
    createdAt: now,
    updatedAt: now,
    pendingSync: 1,
  };
}

export async function getSettlementsByGroupId(groupId: string): Promise<Settlement[]> {
  return await query<Settlement>(
    'SELECT * FROM settlements WHERE groupId = ? ORDER BY settledAt DESC',
    [groupId]
  );
}

export async function getTotalSettledAmount(
  groupId: string,
  fromMemberId: string,
  toMemberId: string
): Promise<number> {
  const result = await queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(amountCents), 0) as total
     FROM settlements
     WHERE groupId = ? AND fromMemberId = ? AND toMemberId = ?`,
    [groupId, fromMemberId, toMemberId]
  );

  return result?.total || 0;
}

export async function getSettlementsPendingSync(): Promise<Settlement[]> {
  return await query<Settlement>('SELECT * FROM settlements WHERE pendingSync = 1');
}

export async function markSettlementSynced(id: string): Promise<void> {
  await execute('UPDATE settlements SET pendingSync = 0 WHERE id = ?', [id]);
}

export async function upsertSettlement(settlement: Settlement): Promise<void> {
  await execute(
    `INSERT INTO settlements (id, groupId, fromMemberId, toMemberId, amountCents, settledAt, note, createdAt, updatedAt, pendingSync)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       groupId = excluded.groupId,
       fromMemberId = excluded.fromMemberId,
       toMemberId = excluded.toMemberId,
       amountCents = excluded.amountCents,
       settledAt = excluded.settledAt,
       note = excluded.note,
       updatedAt = excluded.updatedAt,
       pendingSync = 0`,
    [
      settlement.id,
      settlement.groupId,
      settlement.fromMemberId,
      settlement.toMemberId,
      settlement.amountCents,
      settlement.settledAt,
      settlement.note,
      settlement.createdAt,
      settlement.updatedAt,
    ]
  );
}

export async function deleteSettlement(id: string): Promise<void> {
  await execute('DELETE FROM settlements WHERE id = ?', [id]);
}
