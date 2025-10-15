import { useEffect, useState } from 'react';
import { getSupabase } from '@/db/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface SessionHistory {
  sessionId: string;
  groupName: string;
  date: string;
  note: string | null;
  netCents: number;
}

export interface PlayerStats {
  totalNetCents: number;
  sessionHistory: SessionHistory[];
}

export function usePlayerStats() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats>({
    totalNetCents: 0,
    sessionHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!user) {
      setStats({ totalNetCents: 0, sessionHistory: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();

      // Get all sessions the user is a member of with their results
      const { data: sessionMembersData, error: membersError } = await supabase
        .from('session_members')
        .select('session_id')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      const sessionIds = (sessionMembersData || []).map(sm => sm.session_id);

      if (sessionIds.length === 0) {
        setStats({ totalNetCents: 0, sessionHistory: [] });
        setLoading(false);
        return;
      }

      // Get sessions with results
      const { data, error: queryError } = await supabase
        .from('results')
        .select(`
          net_cents,
          sessions!inner(
            id,
            name,
            date,
            note
          )
        `)
        .in('session_id', sessionIds)
        .order('sessions(date)', { ascending: false });

      if (queryError) throw queryError;

      const sessionHistory: SessionHistory[] = (data || []).map((row: any) => ({
        sessionId: row.sessions.id,
        groupName: row.sessions.name,
        date: row.sessions.date,
        note: row.sessions.note,
        netCents: row.net_cents || 0,
      }));

      // Calculate total net
      const totalNetCents = sessionHistory.reduce(
        (sum, session) => sum + session.netCents,
        0
      );

      setStats({
        totalNetCents,
        sessionHistory,
      });
    } catch (err) {
      console.error('Error loading player stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats,
  };
}
