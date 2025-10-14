import { getSupabase } from '../supabase';
import { Result, MemberBalance } from '@/types';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseResult(row: any): Result {
  return {
    id: row.id,
    sessionId: row.session_id,
    memberId: row.member_id,
    netCents: row.net_cents,
    cashoutCents: row.cashout_cents,
    updatedAt: row.updated_at,
  };
}

export async function createResult(
  sessionId: string,
  memberId: string,
  netCents: number,
  cashoutCents: number = 0
): Promise<Result> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('results')
    .insert({
      session_id: sessionId,
      member_id: memberId,
      net_cents: netCents,
      cashout_cents: cashoutCents,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseResult(data);
}

export async function getResultsBySessionId(sessionId: string): Promise<Result[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('session_id', sessionId);

  if (error) throw error;
  return (data || []).map(mapSupabaseResult);
}

export async function getResultBySessionAndMember(
  sessionId: string,
  memberId: string
): Promise<Result | null> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('session_id', sessionId)
    .eq('member_id', memberId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data ? mapSupabaseResult(data) : null;
}

export async function updateResult(
  id: string,
  netCents: number,
  cashoutCents: number
): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('results')
    .update({
      net_cents: netCents,
      cashout_cents: cashoutCents,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteResult(id: string): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('results')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function calculateMemberBalances(groupId: string): Promise<MemberBalance[]> {
  const supabase = getSupabase();
  
  // Get all results for the group with member names
  const { data, error } = await supabase
    .from('results')
    .select(`
      member_id,
      net_cents,
      members!inner(name, group_id)
    `)
    .eq('members.group_id', groupId);

  if (error) throw error;

  // Group by member and sum
  const balanceMap = new Map<string, { memberId: string; memberName: string; totalCents: number }>();
  
  for (const row of data || []) {
    const memberId = row.member_id;
    const memberName = (row.members as any)?.name || 'Unknown';
    const netCents = row.net_cents || 0;

    if (balanceMap.has(memberId)) {
      const existing = balanceMap.get(memberId)!;
      existing.totalCents += netCents;
    } else {
      balanceMap.set(memberId, {
        memberId,
        memberName,
        totalCents: netCents,
      });
    }
  }

  // Also include members with no results (balance = 0)
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, name')
    .eq('group_id', groupId);

  if (membersError) throw membersError;

  for (const member of members || []) {
    if (!balanceMap.has(member.id)) {
      balanceMap.set(member.id, {
        memberId: member.id,
        memberName: member.name,
        totalCents: 0,
      });
    }
  }

  return Array.from(balanceMap.values());
}
