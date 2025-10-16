import { useEffect, useState } from 'react';
import { getSupabase } from '@/db/supabase';
import { useAuthStore } from '@/stores/authStore';
import * as ManualAdjustmentsRepo from '@/db/repositories/manualAdjustments';
import { ManualAdjustment } from '@/types';

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
  totalAdjustmentsCents: number;
  adjustments: ManualAdjustment[];
}

export function usePlayerStats() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<PlayerStats>({
    totalNetCents: 0,
    sessionHistory: [],
    totalAdjustmentsCents: 0,
    adjustments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!user) {
      setStats({ totalNetCents: 0, sessionHistory: [], totalAdjustmentsCents: 0, adjustments: [] });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabase();

      // Get all sessions the user is a member of with their results (including soft-deleted)
      const { data: sessionMembersData, error: membersError } = await supabase
        .from('session_members')
        .select('session_id')
        .eq('user_id', user.id);

      if (membersError) throw membersError;

      const sessionIds = (sessionMembersData || []).map(sm => sm.session_id);

      // Load manual adjustments
      const adjustments = await ManualAdjustmentsRepo.getUserAdjustments(user.id);
      const totalAdjustmentsCents = adjustments.reduce((sum, adj) => sum + adj.amountCents, 0);

      if (sessionIds.length === 0) {
        setStats({
          totalNetCents: totalAdjustmentsCents,
          sessionHistory: [],
          totalAdjustmentsCents,
          adjustments,
        });
        setLoading(false);
        return;
      }

      // Get the current user's results only (not all members in the session)
      const { data, error: queryError } = await supabase
        .from('results')
        .select(`
          session_id,
          net_cents,
          member_id,
          sessions!inner(
            id,
            name,
            date,
            note
          ),
          members!inner(
            user_id
          )
        `)
        .in('session_id', sessionIds)
        .eq('members.user_id', user.id) // Only get results for the current user
        .order('sessions(date)', { ascending: false });

      if (queryError) throw queryError;

      // Create session history with user's individual results
      const sessionHistory: SessionHistory[] = (data || [])
        .map((row: any) => ({
          sessionId: row.sessions.id,
          groupName: row.sessions.name,
          date: row.sessions.date,
          note: row.sessions.note,
          netCents: row.net_cents || 0,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Calculate total net from sessions
      const sessionsTotalCents = sessionHistory.reduce(
        (sum, session) => sum + session.netCents,
        0
      );

      // Add manual adjustments to total
      const totalNetCents = sessionsTotalCents + totalAdjustmentsCents;

      setStats({
        totalNetCents,
        sessionHistory,
        totalAdjustmentsCents,
        adjustments,
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
