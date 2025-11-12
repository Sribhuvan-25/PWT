import { useEffect, useState } from 'react';
import { Session } from '@/types';
import * as SessionsRepo from '@/db/repositories/sessions';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/utils/logger';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { user } = useAuthStore();

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadSessions = async (isRefresh = false) => {
    try {
      // Only set loading on initial load, use refreshing for subsequent loads
      if (!hasLoadedOnce) {
        setLoading(true);
      } else if (isRefresh) {
        setRefreshing(true);
      }
      setError(null);

      logger.info('🔄 Loading sessions for user:', user?.id);
      // Don't clear existing sessions - keep them visible while loading

      // If user is authenticated with a valid UUID, only load their sessions
      // Otherwise, load all sessions (for testing with non-UUID user IDs)
      const data = user?.id && isValidUUID(user.id)
        ? await SessionsRepo.getUserSessions(user.id)
        : await SessionsRepo.getAllSessions();

      logger.info('📊 Loaded sessions:', data.map(s => ({ id: s.id, name: s.name, status: s.status, date: s.date })));
      setSessions(data);
      setHasLoadedOnce(true);
    } catch (err) {
      logger.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.id]);

  const createSession = async (name: string, date: string, note?: string): Promise<Session> => {
    // Only pass user ID if it's a valid UUID
    const userId = user?.id && isValidUUID(user.id) ? user.id : undefined;
    const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Unknown User';
    const session = await SessionsRepo.createSession(name, date, note, userId, userName);
    await loadSessions();
    return session;
  };

  const joinSession = async (joinCode: string): Promise<Session> => {
    const session = await SessionsRepo.getSessionByJoinCode(joinCode);
    if (!session) {
      throw new Error('Invalid join code');
    }

    const { getSupabase } = await import('@/db/supabase');
    const supabase = getSupabase();

    // Add current user as a member to session_members (for authenticated users)
    if (user?.id && isValidUUID(user.id)) {
      try {
        await supabase
          .from('session_members')
          .insert({
            user_id: user.id,
            session_id: session.id,
            role: 'member',
            joined_at: new Date().toISOString(),
          });
      } catch (err: any) {
        // Ignore duplicate key errors (user already in session_members)
        if (err.code !== '23505') {  // PostgreSQL unique violation
          logger.error('Error adding user to session_members:', err);
        }
        // Continue even if this fails
      }
    }

    // Always create a Member entry (for the participant list)
    logger.info('👤 Current user object:', {
      id: user?.id,
      email: user?.email,
      displayName: user?.displayName,
      name: user?.name
    });

    const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Unknown User';
    const userId = user?.id && isValidUUID(user.id) ? user.id : null;

    logger.info('🔍 Checking for existing member:', { sessionId: session.id, userId, userName });

    // Check if user already has a member record for this session
    const { data: existingMember } = await supabase
      .from('members')
      .select('id')
      .eq('session_id', session.id)
      .eq('user_id', userId)
      .maybeSingle();

    logger.info('🔍 Existing member check:', existingMember ? 'Found' : 'Not found');

    if (!existingMember) {
      // Only insert if not already a member
      try {
        logger.info('➕ Adding user to members table:', { sessionId: session.id, userId, userName });
        await supabase
          .from('members')
          .insert({
            session_id: session.id,
            user_id: userId,
            name: userName,
            created_at: new Date().toISOString(),
          });
        logger.info('✅ Successfully added user to members');
      } catch (err) {
        logger.error('❌ Error adding user to members:', err);
        throw err; // This is critical, so throw
      }
    } else {
      logger.info('ℹ️ User already exists in members table');
    }

    await loadSessions();
    return session;
  };

  const deleteSession = async (id: string) => {
    await SessionsRepo.deleteSession(id);
    await loadSessions();
  };

  const refresh = () => {
    logger.info('🔄 Force refreshing sessions...');
    loadSessions(true); // Pass true to indicate this is a refresh
  };

  return {
    sessions,
    loading,
    refreshing,
    error,
    refresh,
    createSession,
    joinSession,
    deleteSession,
  };
}
