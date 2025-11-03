import { useState, useEffect } from 'react';
import * as ResultsRepo from '@/db/repositories/results';
import * as BuyInsRepo from '@/db/repositories/buyins';
import { Member, BuyIn } from '@/types';
import { logger } from '@/utils/logger';

export interface MemberSessionData {
  memberId: string;
  memberName: string;
  totalBuyIns: number;
  cashout: number;
  netResult: number;
}

interface BuyInHistoryItem extends BuyIn {
  memberName: string;
  approverName: string | null;
}

interface UseSessionDataReturn {
  memberData: MemberSessionData[];
  buyInHistory: BuyInHistoryItem[];
  isLoading: boolean;
  reload: () => Promise<void>;
}

/**
 * Custom hook to manage session data including member stats and buy-in history
 */
export function useSessionData(
  sessionId: string,
  members: Member[],
  buyIns: BuyIn[]
): UseSessionDataReturn {
  const [memberData, setMemberData] = useState<MemberSessionData[]>([]);
  const [buyInHistory, setBuyInHistory] = useState<BuyInHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMemberData = async () => {
    try {
      setIsLoading(true);
      const data: MemberSessionData[] = [];

      for (const member of members) {
        const totalBuyIns = await BuyInsRepo.getTotalBuyInsByMember(
          sessionId,
          member.id
        );
        const result = await ResultsRepo.getResultBySessionAndMember(
          sessionId,
          member.id
        );
        const cashout = result?.cashoutCents || 0;
        // Only calculate net result if cashout has been entered (> 0)
        const netResult = cashout > 0 ? cashout - totalBuyIns : 0;

        data.push({
          memberId: member.id,
          memberName: member.name,
          totalBuyIns,
          cashout,
          netResult,
        });
      }

      setMemberData(data);
    } catch (error) {
      logger.error('Error loading member data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBuyInHistory = () => {
    try {
      // Map all buy-ins with member names and approver names
      const historyWithNames = buyIns.map((buyIn) => {
        const member = members.find((m) => m.id === buyIn.memberId);
        const approver = buyIn.approvedBy
          ? members.find((m) => m.userId === buyIn.approvedBy)
          : null;
        return {
          ...buyIn,
          memberName: member?.name || 'Unknown',
          approverName: approver?.name || (buyIn.approvedBy ? 'Unknown' : null),
        };
      });

      // Sort by creation date, newest first
      const sorted = historyWithNames.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBuyInHistory(sorted);
    } catch (error) {
      logger.error('Error loading buy-in history', error);
    }
  };

  const reload = async () => {
    await loadMemberData();
    loadBuyInHistory();
  };

  useEffect(() => {
    loadMemberData();
  }, [buyIns, members, sessionId]);

  useEffect(() => {
    loadBuyInHistory();
  }, [buyIns, members]);

  return {
    memberData,
    buyInHistory,
    isLoading,
    reload,
  };
}

export default useSessionData;
