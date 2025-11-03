import { useState, useEffect } from 'react';
import * as SettlementsRepo from '@/db/repositories/settlements';
import { Settlement } from '@/types';
import { logger } from '@/utils/logger';
import { handleError } from '@/utils/errorHandler';

interface UseSessionSettlementsReturn {
  settlements: Settlement[];
  isLoading: boolean;
  togglePaidStatus: (settlementId: string, currentPaidStatus: boolean) => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Custom hook to manage session settlements
 */
export function useSessionSettlements(
  sessionId: string,
  sessionStatus: string | undefined,
  userId: string | undefined
): UseSessionSettlementsReturn {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSettlements = async () => {
    try {
      setIsLoading(true);
      const data = await SettlementsRepo.getSettlementsBySessionId(sessionId);
      setSettlements(data);
    } catch (error) {
      logger.error('Error loading settlements', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load settlements if session is completed
    if (sessionStatus === 'completed') {
      loadSettlements();
    }
  }, [sessionId, sessionStatus]);

  const togglePaidStatus = async (
    settlementId: string,
    currentPaidStatus: boolean
  ) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      if (currentPaidStatus) {
        // Mark as unpaid
        await SettlementsRepo.markSettlementAsUnpaid(settlementId);
      } else {
        // Mark as paid
        await SettlementsRepo.markSettlementAsPaid(settlementId, userId);
      }
      // Reload settlements
      await loadSettlements();
    } catch (error) {
      handleError(error, {
        title: 'Update Failed',
        message: 'Failed to update settlement status. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async () => {
    await loadSettlements();
  };

  return {
    settlements,
    isLoading,
    togglePaidStatus,
    reload,
  };
}

export default useSessionSettlements;
