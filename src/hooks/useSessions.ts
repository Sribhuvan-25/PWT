import { useEffect, useState } from 'react';
import { Session } from '@/types';
import * as SessionsRepo from '@/db/repositories/sessions';
import { useAuthStore } from '@/stores/authStore';

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If user is authenticated with a valid UUID, only load their sessions
      // Otherwise, load all sessions (for testing with non-UUID user IDs)
      const data = user?.id && isValidUUID(user.id)
        ? await SessionsRepo.getUserSessions(user.id)
        : await SessionsRepo.getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [user?.id]);

  const createSession = async (name: string, date: string, note?: string): Promise<Session> => {
    // Only pass user ID if it's a valid UUID
    const userId = user?.id && isValidUUID(user.id) ? user.id : user?.id;
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
      } catch (err) {
        console.error('Error adding user to session_members:', err);
        // Continue even if this fails
      }
    }

    // Always create a Member entry (for the participant list)
    if (user?.id) {
      const userName = user?.displayName || user?.name || user?.email?.split('@')[0] || 'Unknown User';
      try {
        await supabase
          .from('members')
          .insert({
            session_id: session.id,
            user_id: user.id,
            name: userName,
            created_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Error adding user to members:', err);
        throw err; // This is critical, so throw
      }
    }

    await loadSessions();
    return session;
  };

  const deleteSession = async (id: string) => {
    await SessionsRepo.deleteSession(id);
    await loadSessions();
  };

  return {
    sessions,
    loading,
    error,
    refresh: loadSessions,
    createSession,
    joinSession,
    deleteSession,
  };
}
