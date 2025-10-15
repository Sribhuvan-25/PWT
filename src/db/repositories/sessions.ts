import { getSupabase } from '../supabase';
import { Session } from '@/types';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseSession(row: any): Session {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    date: row.date,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to generate a random join code
function generateJoinCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createSession(
  name: string,
  date: string,
  note?: string,
  userId?: string,
  userName?: string
): Promise<Session> {
  const supabase = getSupabase();

  const joinCode = generateJoinCode();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      name,
      join_code: joinCode,
      date,
      note,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  const session = mapSupabaseSession(data);

  // Add creator as admin to session_members if userId provided (for authenticated users)
  if (userId) {
    try {
      await supabase
        .from('session_members')
        .insert({
          user_id: userId,
          session_id: session.id,
          role: 'admin',
          joined_at: new Date().toISOString(),
        });
    } catch (err) {
      console.error('Error adding creator to session_members:', err);
      // Continue even if this fails (e.g., for non-UUID user IDs)
    }
  }

  // Always create a Member entry for the creator (for the participant list)
  if (userName) {
    try {
      await supabase
        .from('members')
        .insert({
          session_id: session.id,
          user_id: userId || null, // Link to user if available
          name: userName,
          created_at: new Date().toISOString(),
        });
    } catch (err) {
      console.error('Error adding creator to members:', err);
      // If member creation fails, throw error as this is critical
      throw err;
    }
  }

  return session;
}

export async function getAllSessions(): Promise<Session[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseSession);
}

export async function getSessionByJoinCode(joinCode: string): Promise<Session | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('join_code', joinCode.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data ? mapSupabaseSession(data) : null;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*, session_members!inner(user_id)')
    .eq('session_members.user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseSession);
}

export async function getSessionById(id: string): Promise<Session | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data ? mapSupabaseSession(data) : null;
}

export async function updateSession(
  id: string,
  updates: { note?: string; status?: 'active' | 'completed' }
): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateSessionStatus(
  id: string,
  status: 'active' | 'completed'
): Promise<void> {
  return updateSession(id, { status });
}
