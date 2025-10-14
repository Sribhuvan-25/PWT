import { query, queryOne, execute } from '../sqlite';
import { Group } from '@/types';
import * as Crypto from 'expo-crypto';
import { createMember } from './members';

async function generateJoinCode(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(3);
  const code = Array.from(randomBytes)
    .map((byte) => byte.toString(36).toUpperCase())
    .join('')
    .substring(0, 6);
  return code;
}

export async function createGroup(
  name: string,
  creatorName: string
): Promise<Group> {
  const id = Crypto.randomUUID();
  const joinCode = await generateJoinCode();
  const now = new Date().toISOString();

  // Create group and automatically add creator as a member
  await execute(
    'INSERT INTO groups (id, name, joinCode, createdAt, updatedAt, pendingSync) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, joinCode, now, now, 1]
  );

  // Automatically add creator as a member
  await createMember(id, creatorName);

  return {
    id,
    name,
    joinCode,
    createdAt: now,
    updatedAt: now,
    pendingSync: 1,
  };
}

export async function getAllGroups(): Promise<Group[]> {
  return await query<Group>('SELECT * FROM groups ORDER BY createdAt DESC');
}

export async function getGroupById(id: string): Promise<Group | null> {
  return await queryOne<Group>('SELECT * FROM groups WHERE id = ?', [id]);
}

export async function getGroupByJoinCode(joinCode: string): Promise<Group | null> {
  return await queryOne<Group>('SELECT * FROM groups WHERE joinCode = ?', [joinCode]);
}

export async function updateGroup(id: string, name: string): Promise<void> {
  const now = new Date().toISOString();
  await execute(
    'UPDATE groups SET name = ?, updatedAt = ?, pendingSync = 1 WHERE id = ?',
    [name, now, id]
  );
}

export async function deleteGroup(id: string): Promise<void> {
  await execute('DELETE FROM groups WHERE id = ?', [id]);
}

export async function getGroupsPendingSync(): Promise<Group[]> {
  return await query<Group>('SELECT * FROM groups WHERE pendingSync = 1');
}

export async function markGroupSynced(id: string): Promise<void> {
  await execute('UPDATE groups SET pendingSync = 0 WHERE id = ?', [id]);
}

export async function upsertGroup(group: Group): Promise<void> {
  await execute(
    `INSERT INTO groups (id, name, joinCode, createdAt, updatedAt, pendingSync)
     VALUES (?, ?, ?, ?, ?, 0)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       joinCode = excluded.joinCode,
       updatedAt = excluded.updatedAt,
       pendingSync = 0`,
    [group.id, group.name, group.joinCode, group.createdAt, group.updatedAt]
  );
}
