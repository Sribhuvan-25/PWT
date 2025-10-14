import { useEffect, useState } from 'react';
import { BuyIn } from '@/types';
import * as BuyInsRepo from '@/db/repositories/buyins';

export function useBuyIns(sessionId: string | null) {
  const [buyIns, setBuyIns] = useState<BuyIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBuyIns = async () => {
    if (!sessionId) {
      setBuyIns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await BuyInsRepo.getBuyInsBySessionId(sessionId);
      setBuyIns(data);
    } catch (err) {
      console.error('Error loading buy-ins:', err);
      setError(err instanceof Error ? err.message : 'Failed to load buy-ins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyIns();
  }, [sessionId]);

  const addBuyIn = async (memberId: string, amountCents: number): Promise<BuyIn> => {
    if (!sessionId) throw new Error('No session selected');
    const buyIn = await BuyInsRepo.createBuyIn(sessionId, memberId, amountCents);
    await loadBuyIns();
    return buyIn;
  };

  const getTotalBuyIns = async (memberId: string): Promise<number> => {
    if (!sessionId) return 0;
    return await BuyInsRepo.getTotalBuyInsByMember(sessionId, memberId);
  };

  const getSessionTotalBuyIns = async (): Promise<number> => {
    if (!sessionId) return 0;
    return await BuyInsRepo.getTotalBuyInsBySession(sessionId);
  };

  return {
    buyIns,
    loading,
    error,
    refresh: loadBuyIns,
    addBuyIn,
    getTotalBuyIns,
    getSessionTotalBuyIns,
  };
}

