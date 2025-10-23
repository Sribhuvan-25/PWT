import { getSupabase } from '../supabase';

export interface PushToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

// Helper to convert Supabase snake_case to camelCase
function mapSupabasePushToken(row: any): PushToken {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    platform: row.platform,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
  };
}

/**
 * Save or update a push token for a user
 */
export async function savePushToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android' | 'web'
): Promise<PushToken> {
  const supabase = getSupabase();

  // Try to update existing token first
  const { data: existing } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('token', token)
    .single();

  if (existing) {
    // Update existing token
    const { data, error } = await supabase
      .from('push_tokens')
      .update({
        platform,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return mapSupabasePushToken(data);
  } else {
    // Insert new token
    const { data, error } = await supabase
      .from('push_tokens')
      .insert({
        user_id: userId,
        token,
        platform,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSupabasePushToken(data);
  }
}

/**
 * Get all push tokens for a user
 */
export async function getUserPushTokens(userId: string): Promise<PushToken[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapSupabasePushToken);
}

/**
 * Get push tokens for multiple users
 */
export async function getPushTokensForUsers(userIds: string[]): Promise<PushToken[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('push_tokens')
    .select('*')
    .in('user_id', userIds);

  if (error) throw error;
  return (data || []).map(mapSupabasePushToken);
}

/**
 * Delete a push token
 */
export async function deletePushToken(tokenId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('id', tokenId);

  if (error) throw error;
}

/**
 * Delete all push tokens for a user
 */
export async function deleteAllUserPushTokens(userId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Update last used timestamp for a token
 */
export async function updateTokenLastUsed(tokenId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('push_tokens')
    .update({
      last_used_at: new Date().toISOString(),
    })
    .eq('id', tokenId);

  if (error) throw error;
}

/**
 * Get push tokens for session admins (for sending notifications)
 */
export async function getSessionAdminPushTokens(sessionId: string): Promise<PushToken[]> {
  const supabase = getSupabase();

  // Get admin user IDs for this session
  const { data: sessionMembers, error: membersError } = await supabase
    .from('session_members')
    .select('user_id')
    .eq('session_id', sessionId)
    .eq('role', 'admin');

  if (membersError) throw membersError;

  const adminUserIds = (sessionMembers || []).map(sm => sm.user_id);

  if (adminUserIds.length === 0) {
    return [];
  }

  // Get push tokens for these admins
  return getPushTokensForUsers(adminUserIds);
}
