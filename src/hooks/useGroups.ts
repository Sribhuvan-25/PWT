import { useEffect, useState } from 'react';
import { Group } from '@/types';
import * as GroupsRepo from '@/db/repositories/groups';
import { useAuthStore } from '@/stores/authStore';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GroupsRepo.getAllGroups();
      setGroups(data);
    } catch (err) {
      console.error('Error loading groups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const createGroup = async (name: string): Promise<Group> => {
    const creatorName = user?.name || user?.email || 'You';
    const group = await GroupsRepo.createGroup(name, creatorName);
    await loadGroups();
    return group;
  };

  const deleteGroup = async (id: string) => {
    await GroupsRepo.deleteGroup(id);
    await loadGroups();
  };

  return {
    groups,
    loading,
    error,
    refresh: loadGroups,
    createGroup,
    deleteGroup,
  };
}
