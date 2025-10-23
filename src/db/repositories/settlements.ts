import { getSupabase } from '../supabase';
import { Settlement } from '@/types';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseSettlement(row: any): Settlement {
  return {
    id: row.id,
    sessionId: row.session_id,
    fromMemberId: row.from_member_id,
    toMemberId: row.to_member_id,
    amountCents: row.amount_cents,
    settledAt: row.settled_at,
    note: row.note,
    paid: row.paid ?? false,
    paidAt: row.paid_at,
    paidBy: row.paid_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSettlement(
  sessionId: string,
  fromMemberId: string,
  toMemberId: string,
  amountCents: number,
  note?: string
): Promise<Settlement> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('settlements')
    .insert({
      session_id: sessionId,
      from_member_id: fromMemberId,
      to_member_id: toMemberId,
      amount_cents: amountCents,
      settled_at: now,
      note,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseSettlement(data);
}

export async function getSettlementsBySessionId(sessionId: string): Promise<Settlement[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('session_id', sessionId)
    .order('settled_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseSettlement);
}

export async function getTotalSettledAmount(
  sessionId: string,
  fromMemberId: string,
  toMemberId: string
): Promise<number> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('settlements')
    .select('amount_cents')
    .eq('session_id', sessionId)
    .eq('from_member_id', fromMemberId)
    .eq('to_member_id', toMemberId);

  if (error) throw error;
  
  return (data || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0);
}

export async function deleteSettlement(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function markSettlementAsPaid(id: string, userId: string): Promise<Settlement> {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('settlements')
    .update({
      paid: true,
      paid_at: now,
      paid_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseSettlement(data);
}

export async function markSettlementAsUnpaid(id: string): Promise<Settlement> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('settlements')
    .update({
      paid: false,
      paid_at: null,
      paid_by: null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseSettlement(data);
}

export async function getUnpaidSettlements(sessionId: string): Promise<Settlement[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('session_id', sessionId)
    .eq('paid', false)
    .order('settled_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseSettlement);
}

export async function getPaidSettlements(sessionId: string): Promise<Settlement[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('session_id', sessionId)
    .eq('paid', true)
    .order('paid_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseSettlement);
}
