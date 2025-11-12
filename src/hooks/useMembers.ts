import { useEffect, useState } from 'react';
import { Member } from '@/types';
import * as MembersRepo from '@/db/repositories/members';
import { logger } from '@/utils/logger';

export function useMembers(sessionId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    if (!sessionId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await MembersRepo.getMembersBySessionId(sessionId);
      setMembers(data);
    } catch (err) {
      logger.error('Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [sessionId]);

  const addMember = async (name: string): Promise<Member> => {
    if (!sessionId) throw new Error('No session selected');
    const member = await MembersRepo.createMember(sessionId, name);
    await loadMembers();
    return member;
  };

  const deleteMember = async (id: string) => {
    await MembersRepo.deleteMember(id);
    await loadMembers();
  };

  return {
    members,
    loading,
    error,
    refresh: loadMembers,
    addMember,
    deleteMember,
  };
}
