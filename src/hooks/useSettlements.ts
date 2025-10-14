import { useEffect, useState } from 'react';
import { Settlement } from '@/types';
import * as SettlementsRepo from '@/db/repositories/settlements';

export function useSettlements(sessionId: string | null) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettlements = async () => {
    if (!sessionId) {
      setSettlements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await SettlementsRepo.getSettlementsBySessionId(sessionId);
      setSettlements(data);
    } catch (err) {
      console.error('Error loading settlements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, [sessionId]);

  const recordSettlement = async (
    fromMemberId: string,
    toMemberId: string,
    amountCents: number,
    note?: string
  ): Promise<Settlement> => {
    if (!sessionId) throw new Error('No session selected');
    const settlement = await SettlementsRepo.createSettlement(
      sessionId,
      fromMemberId,
      toMemberId,
      amountCents,
      note
    );
    await loadSettlements();
    return settlement;
  };

  const getTotalSettled = async (fromMemberId: string, toMemberId: string): Promise<number> => {
    if (!sessionId) return 0;
    return await SettlementsRepo.getTotalSettledAmount(sessionId, fromMemberId, toMemberId);
  };

  return {
    settlements,
    loading,
    error,
    refresh: loadSettlements,
    recordSettlement,
    getTotalSettled,
  };
}
