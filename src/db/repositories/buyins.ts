import { getSupabase } from '../supabase';
import { BuyIn } from '@/types';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseBuyIn(row: any): BuyIn {
  return {
    id: row.id,
    sessionId: row.session_id,
    memberId: row.member_id,
    amountCents: row.amount_cents,
    createdAt: row.created_at,
  };
}

export async function createBuyIn(
  sessionId: string,
  memberId: string,
  amountCents: number
): Promise<BuyIn> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('buy_ins')
    .insert({
      session_id: sessionId,
      member_id: memberId,
      amount_cents: amountCents,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseBuyIn(data);
}

export async function getBuyInsBySessionId(sessionId: string): Promise<BuyIn[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('buy_ins')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseBuyIn);
}

export async function getTotalBuyInsByMember(
  sessionId: string,
  memberId: string
): Promise<number> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('buy_ins')
    .select('amount_cents')
    .eq('session_id', sessionId)
    .eq('member_id', memberId);

  if (error) throw error;
  
  return (data || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0);
}

export async function getTotalBuyInsBySession(sessionId: string): Promise<number> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('buy_ins')
    .select('amount_cents')
    .eq('session_id', sessionId);

  if (error) throw error;
  
  return (data || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0);
}

export async function deleteBuyIn(id: string): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('buy_ins')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
