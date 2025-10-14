import { query, queryOne, execute } from '../sqlite';
import { Member } from '@/types';
import * as Crypto from 'expo-crypto';

export async function createMember(groupId: string, name: string): Promise<Member> {
  const id = Crypto.randomUUID();
  const now = new Date().toISOString();

  await execute(
    'INSERT INTO members (id, groupId, name, createdAt, updatedAt, pendingSync) VALUES (?, ?, ?, ?, ?, ?)',
    [id, groupId, name, now, now, 1]
  );

  return {
    id,
    groupId,
    name,
    createdAt: now,
    updatedAt: now,
    pendingSync: 1,
  };
}

export async function getMembersByGroupId(groupId: string): Promise<Member[]> {
  return await query<Member>(
    'SELECT * FROM members WHERE groupId = ? ORDER BY name ASC',
    [groupId]
  );
}

export async function getMemberById(id: string): Promise<Member | null> {
  return await queryOne<Member>('SELECT * FROM members WHERE id = ?', [id]);
}

export async function updateMember(id: string, name: string): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    'UPDATE members SET name = ?, updatedAt = ?, pendingSync = 1 WHERE id = ?',
    [name, now, id]
  );
}

export async function deleteMember(id: string): Promise<void> {
  await execute('DELETE FROM members WHERE id = ?', [id]);
}

export async function getMembersPendingSync(): Promise<Member[]> {
  return await query<Member>('SELECT * FROM members WHERE pendingSync = 1');
}

export async function markMemberSynced(id: string): Promise<void> {
  await execute('UPDATE members SET pendingSync = 0 WHERE id = ?', [id]);
}

export async function upsertMember(member: Member): Promise<void> {
  await execute(
    `INSERT INTO members (id, groupId, name, createdAt, updatedAt, pendingSync)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       groupId = excluded.groupId,
       updatedAt = excluded.updatedAt,
       pendingSync = 0`,
    [member.id, member.groupId, member.name, member.createdAt, member.updatedAt]
  );
}
