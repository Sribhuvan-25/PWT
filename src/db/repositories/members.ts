import { getSupabase } from '../supabase';
import { Member } from '@/types';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseMember(row: any): Member {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMember(sessionId: string, name: string): Promise<Member> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('members')
    .insert({
      session_id: sessionId,
      name,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseMember(data);
}

export async function getMembersBySessionId(sessionId: string): Promise<Member[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('session_id', sessionId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapSupabaseMember);
}

export async function getMemberById(id: string): Promise<Member | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data ? mapSupabaseMember(data) : null;
}

export async function updateMember(id: string, name: string): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('members')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMember(id: string): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
