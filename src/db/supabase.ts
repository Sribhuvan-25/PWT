import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export function initSupabase(): SupabaseClient {
  if (supabase) return supabase;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error('Supabase credentials not configured in environment');
    throw new Error('Supabase URL and Anon Key must be set in .env file');
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  logger.info('Supabase client initialized');
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

export async function fetchSessions() {
  const client = getSupabase();
  const { data, error } = await client
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchSessionByJoinCode(joinCode: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from('sessions')
    .select('*')
    .eq('join_code', joinCode)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMembers(sessionId: string) {
  const client = getSupabase();
  const { data, error } = await client
    .from('members')
    .select('*')
    .eq('session_id', sessionId)
    .order('name', { ascending: true });

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

  const [sessions, members, results] = await Promise.all([
    client.from('sessions').select('*').gte('updated_at', lastSyncAt),
    client.from('members').select('*').gte('updated_at', lastSyncAt),
    client.from('results').select('*').gte('updated_at', lastSyncAt),
  ]);

  return {
    sessions: sessions.data || [],
    members: members.data || [],
    results: results.data || [],
  };
}

export function subscribeToSession(
  sessionId: string,
  callbacks: {
    onSessionChange?: (payload: any) => void;
    onResultChange?: (payload: any) => void;
    onMemberChange?: (payload: any) => void;
  }
): RealtimeChannel {
  const client = getSupabase();

  const channel = client
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        logger.debug('Realtime: Session change received', { sessionId, event: payload.eventType });
        callbacks.onSessionChange?.(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'results',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        logger.debug('Realtime: Result change received', { sessionId, event: payload.eventType });
        callbacks.onResultChange?.(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'members',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        logger.debug('Realtime: Member change received', { sessionId, event: payload.eventType });
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
