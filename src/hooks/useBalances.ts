import { useEffect, useState } from 'react';
import { MemberBalance, SettleUpTransaction } from '@/types';
import * as ResultsRepo from '@/db/repositories/results';
import { calculateSettleUpTransactions } from '@/utils/settleUp';

export function useBalances(groupId: string | null) {
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [settleUp, setSettleUp] = useState<SettleUpTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalances = async () => {
    if (!groupId) {
      setBalances([]);
      setSettleUp([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await ResultsRepo.calculateMemberBalances(groupId);
      setBalances(data);

      const transactions = calculateSettleUpTransactions(data);
      setSettleUp(transactions);
    } catch (err) {
      console.error('Error loading balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [groupId]);

  return {
    balances,
    settleUp,
    loading,
    error,
    refresh: loadBalances,
  };
}
