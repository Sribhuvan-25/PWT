import { getSupabase } from '../supabase';
import { BuyIn } from '@/types';
import * as NotificationManager from '@/services/notificationManager';
import { logger } from '@/utils/logger';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseBuyIn(row: any): BuyIn {
  return {
    id: row.id,
    sessionId: row.session_id,
    memberId: row.member_id,
    amountCents: row.amount_cents,
    approved: row.approved ?? false,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
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

  const buyIn = mapSupabaseBuyIn(data);

  // Send notification to session admins (fire and forget)
  const { data: member } = await supabase
    .from('members')
    .select('name')
    .eq('id', memberId)
    .single();

  if (member) {
    NotificationManager.notifyBuyInRequest(
      sessionId,
      member.name,
      amountCents
    ).catch(err => logger.error('Failed to send buy-in notification:', err));
  }

  return buyIn;
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

  const { data, error} = await supabase
    .from('buy_ins')
    .select('amount_cents')
    .eq('session_id', sessionId)
    .eq('member_id', memberId)
    .eq('approved', true); // Only count approved buy-ins

  if (error) throw error;

  return (data || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0);
}

export async function getTotalBuyInsBySession(sessionId: string): Promise<number> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('buy_ins')
    .select('amount_cents')
    .eq('session_id', sessionId)
    .eq('approved', true); // Only count approved buy-ins

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

export async function approveBuyIn(id: string, userId: string): Promise<BuyIn> {
  const supabase = getSupabase();

  // Get buy-in with member info before updating
  const { data: buyInData } = await supabase
    .from('buy_ins')
    .select('*, members!inner(user_id)')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('buy_ins')
    .update({
      approved: true,
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  const buyIn = mapSupabaseBuyIn(data);

  // Send approval notification to the member (fire and forget)
  if (buyInData && buyInData.members?.user_id) {
    NotificationManager.notifyBuyInApproved(
      buyIn.sessionId,
      buyInData.members.user_id,
      buyIn.amountCents
    ).catch(err => logger.error('Failed to send approval notification:', err));
  }

  return buyIn;
}

export async function getPendingBuyIns(sessionId: string): Promise<BuyIn[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('buy_ins')
    .select('*')
    .eq('session_id', sessionId)
    .eq('approved', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseBuyIn);
}

export async function getPendingBuyInsCountBySession(userId: string): Promise<Map<string, number>> {
  const supabase = getSupabase();

  // First, get all sessions where the user is an admin
  const { data: adminSessions, error: sessionsError } = await supabase
    .from('session_members')
    .select('session_id')
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (sessionsError) throw sessionsError;

  if (!adminSessions || adminSessions.length === 0) {
    return new Map();
  }

  const sessionIds = adminSessions.map(s => s.session_id);

  // Get all pending buy-ins for these sessions
  const { data: pendingBuyIns, error: buyInsError } = await supabase
    .from('buy_ins')
    .select('session_id')
    .in('session_id', sessionIds)
    .eq('approved', false);

  if (buyInsError) throw buyInsError;

  // Count pending buy-ins per session
  const counts = new Map<string, number>();
  (pendingBuyIns || []).forEach(buyIn => {
    const count = counts.get(buyIn.session_id) || 0;
    counts.set(buyIn.session_id, count + 1);
  });

  return counts;
}
