import { getSupabase } from '../supabase';
import { ManualAdjustment } from '@/types';

// Helper to convert Supabase snake_case to camelCase
function mapSupabaseAdjustment(row: any): ManualAdjustment {
  return {
    id: row.id,
    userId: row.user_id,
    amountCents: row.amount_cents,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserAdjustments(userId: string): Promise<ManualAdjustment[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('manual_adjustments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabaseAdjustment);
}

export async function createAdjustment(
  userId: string,
  amountCents: number,
  note?: string
): Promise<ManualAdjustment> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('manual_adjustments')
    .insert({
      user_id: userId,
      amount_cents: amountCents,
      note,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseAdjustment(data);
}

export async function deleteAdjustment(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('manual_adjustments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getTotalAdjustments(userId: string): Promise<number> {
  const adjustments = await getUserAdjustments(userId);
  return adjustments.reduce((sum, adj) => sum + adj.amountCents, 0);
}
