import { useEffect, useState } from 'react';
import { Session } from '@/types';
import * as SessionsRepo from '@/db/repositories/sessions';

export function useSessions(groupId: string | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = async () => {
    if (!groupId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await SessionsRepo.getSessionsByGroupId(groupId);
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
  }, [groupId]);

  const createSession = async (date: string, note?: string): Promise<Session> => {
    if (!groupId) throw new Error('No group selected');
    const session = await SessionsRepo.createSession(groupId, date, note);
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
    deleteSession,
  };
}
