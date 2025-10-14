import { useEffect, useState } from 'react';
import { Member } from '@/types';
import * as MembersRepo from '@/db/repositories/members';

export function useMembers(groupId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    if (!groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await MembersRepo.getMembersByGroupId(groupId);
      setMembers(data);
    } catch (err) {
      console.error('Error loading members:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const addMember = async (name: string): Promise<Member> => {
    if (!groupId) throw new Error('No group selected');
    const member = await MembersRepo.createMember(groupId, name);
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
