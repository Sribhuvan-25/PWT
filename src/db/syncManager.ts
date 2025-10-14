import NetInfo from '@react-native-community/netinfo';
import { isSupabaseConfigured, pullChanges, upsertRecords } from './supabase';
import { query, queryOne, execute } from './sqlite';
import { Group, Member, Session, Result } from '@/types';
import {
  getGroupsPendingSync,
  markGroupSynced,
  upsertGroup as upsertGroupLocal,
} from './repositories/groups';
import {
  getMembersPendingSync,
  markMemberSynced,
  upsertMember as upsertMemberLocal,
} from './repositories/members';
import {
  getSessionsPendingSync,
  markSessionSynced,
  upsertSession as upsertSessionLocal,
} from './repositories/sessions';
import {
  getResultsPendingSync,
  markResultSynced,
  upsertResult as upsertResultLocal,
} from './repositories/results';

let isSyncing = false;
let lastSyncAt: string | null = null;

async function getLastSyncTimestamp(): Promise<string> {
  if (lastSyncAt) return lastSyncAt;

  const result = await queryOne<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    ['last_sync_at']
  );

  if (result) {
    lastSyncAt = result.value;
    return lastSyncAt;
  }

  // Default to 7 days ago for initial sync
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return sevenDaysAgo.toISOString();
}

async function setLastSyncTimestamp(timestamp: string): Promise<void> {
  lastSyncAt = timestamp;
  await execute(
    'INSERT OR REPLACE INTO app_metadata (key, value, updatedAt) VALUES (?, ?, ?)',
    ['last_sync_at', timestamp, new Date().toISOString()]
  );
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

async function pullFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping pull');
    return;
  }

  console.log('⬇️ Pulling changes from Supabase...');

  const lastSync = await getLastSyncTimestamp();
  const changes = await pullChanges(lastSync);

  for (const group of changes.groups) {
    const local = await queryOne<Group>('SELECT * FROM groups WHERE id = ?', [group.id]);

    if (!local || new Date(group.updated_at) > new Date(local.updatedAt || '')) {
      await upsertGroupLocal({
        id: group.id,
        name: group.name,
        joinCode: group.join_code,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      });
    }
  }

  for (const member of changes.members) {
    const local = await queryOne<Member>('SELECT * FROM members WHERE id = ?', [member.id]);

    if (!local || new Date(member.updated_at) > new Date(local.updatedAt || '')) {
      await upsertMemberLocal({
        id: member.id,
        groupId: member.group_id,
        name: member.name,
        createdAt: member.created_at,
        updatedAt: member.updated_at,
      });
    }
  }

  for (const session of changes.sessions) {
    const local = await queryOne<Session>('SELECT * FROM sessions WHERE id = ?', [session.id]);

    if (!local || new Date(session.updated_at) > new Date(local.updatedAt || '')) {
      await upsertSessionLocal({
        id: session.id,
        groupId: session.group_id,
        date: session.date,
        note: session.note,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      });
    }
  }

  for (const result of changes.results) {
    const local = await queryOne<Result>('SELECT * FROM results WHERE id = ?', [result.id]);

    if (!local || new Date(result.updated_at) > new Date(local.updatedAt || '')) {
      await upsertResultLocal({
        id: result.id,
        sessionId: result.session_id,
        memberId: result.member_id,
        netCents: result.net_cents,
        updatedAt: result.updated_at,
      });
    }
  }

  console.log(
    `✅ Pulled ${changes.groups.length} groups, ${changes.members.length} members, ${changes.sessions.length} sessions, ${changes.results.length} results`
  );
}

async function pushToSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, skipping push');
    return;
  }

  console.log('⬆️ Pushing changes to Supabase...');

  const groups = await getGroupsPendingSync();
  const members = await getMembersPendingSync();
  const sessions = await getSessionsPendingSync();
  const results = await getResultsPendingSync();

  if (groups.length > 0) {
    const payload = groups.map((g) => ({
      id: g.id,
      name: g.name,
      join_code: g.joinCode,
      created_at: g.createdAt,
      updated_at: g.updatedAt,
    }));
    await upsertRecords('groups', payload);

    for (const group of groups) {
      await markGroupSynced(group.id);
    }
  }

  if (members.length > 0) {
    const payload = members.map((m) => ({
      id: m.id,
      group_id: m.groupId,
      name: m.name,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    }));
    await upsertRecords('members', payload);

    for (const member of members) {
      await markMemberSynced(member.id);
    }
  }

  if (sessions.length > 0) {
    const payload = sessions.map((s) => ({
      id: s.id,
      group_id: s.groupId,
      date: s.date,
      note: s.note,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));
    await upsertRecords('sessions', payload);

    for (const session of sessions) {
      await markSessionSynced(session.id);
    }
  }

  if (results.length > 0) {
    const payload = results.map((r) => ({
      id: r.id,
      session_id: r.sessionId,
      member_id: r.memberId,
      net_cents: r.netCents,
      updated_at: r.updatedAt,
    }));
    await upsertRecords('results', payload);

    for (const result of results) {
      await markResultSynced(result.id);
    }
  }

  console.log(
    `✅ Pushed ${groups.length} groups, ${members.length} members, ${sessions.length} sessions, ${results.length} results`
  );
}

export async function sync(): Promise<void> {
  if (isSyncing) {
    console.log('⚠️ Sync already in progress, skipping');
    return;
  }

  if (!(await isOnline())) {
    console.log('📵 Device offline, skipping sync');
    return;
  }

  try {
    isSyncing = true;
    console.log('🔄 Starting sync...');

    await pushToSupabase();

    await pullFromSupabase();

    await setLastSyncTimestamp(new Date().toISOString());

    console.log('✅ Sync complete');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    isSyncing = false;
  }
}

/**
 * Get sync status
 */
export function getSyncStatus() {
  return {
    isSyncing,
    lastSyncAt,
  };
}

/**
 * Initialize sync manager (set up periodic sync)
 */
export function initSyncManager() {
  console.log('🔄 Sync manager initialized');

  // Sync on network state change
  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      console.log('📶 Network connected, triggering sync');
      sync().catch((err) => console.error('Sync error:', err));
    }
  });

  // Initial sync
  sync().catch((err) => console.error('Initial sync error:', err));
}
