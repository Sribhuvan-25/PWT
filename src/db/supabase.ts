import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient {
  if (supabase) return supabase;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase credentials not configured');
    throw new Error('Supabase URL and Anon Key must be set in .env file');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log('✅ Supabase client initialized');
  return supabase;
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    return initSupabase();
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'your-project-url');
}

export async function fetchGroups() {
  const client = getSupabase();
  const { data, error } = await client
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchGroupByJoinCode(joinCode: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from('groups')
    .select('*')
    .eq('join_code', joinCode)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMembers(groupId: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from('members')
    .select('*')
    .eq('group_id', groupId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchSessions(groupId: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from('sessions')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchResults(sessionId: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from('results')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;
  return data;
}

export async function upsertRecords(table: string, records: any[]) {
  const client = getSupabase();
  const { data, error } = await client
    .from(table)
    .upsert(records, { onConflict: 'id' });

  if (error) throw error;
  return data;
}

export async function pullChanges(lastSyncAt: string) {
  const client = getSupabase();

  const [groups, members, sessions, results] = await Promise.all([
    client.from('groups').select('*').gte('updated_at', lastSyncAt),
    client.from('members').select('*').gte('updated_at', lastSyncAt),
    client.from('sessions').select('*').gte('updated_at', lastSyncAt),
    client.from('results').select('*').gte('updated_at', lastSyncAt),
  ]);

  return {
    groups: groups.data || [],
    members: members.data || [],
    sessions: sessions.data || [],
    results: results.data || [],
  };
}

export function subscribeToGroup(
  groupId: string,
  callbacks: {
    onSessionChange?: (payload: any) => void;
    onResultChange?: (payload: any) => void;
    onMemberChange?: (payload: any) => void;
  }
): RealtimeChannel {
  const client = getSupabase();

  const channel = client
    .channel(`group:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        console.log('🔔 Session change:', payload);
        callbacks.onSessionChange?.(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'results',
      },
      (payload) => {
        console.log('🔔 Result change:', payload);
        callbacks.onResultChange?.(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        console.log('🔔 Member change:', payload);
        callbacks.onMemberChange?.(payload);
      }
    )
    .subscribe();

  return channel;
}

export async function unsubscribeChannel(channel: RealtimeChannel) {
  const client = getSupabase();
  await client.removeChannel(channel);
}
