import { useState, useEffect } from 'react';
import * as BuyInsRepo from '@/db/repositories/buyins';
import * as SessionsRepo from '@/db/repositories/sessions';
import { Member } from '@/types';
import { logger } from '@/utils/logger';
import { handleError, showConfirmation } from '@/utils/errorHandler';

interface PendingBuyIn {
  id: string;
  memberId: string;
  memberName: string;
  amountCents: number;
  createdAt: string;
  approved: boolean;
}

interface UseBuyInApprovalsReturn {
  isAdmin: boolean;
  pendingBuyIns: PendingBuyIn[];
  selectedBuyInIds: Set<string>;
  isLoading: boolean;
  toggleSelection: (buyInId: string) => void;
  toggleSelectAll: () => void;
  approveBuyIn: (buyInId: string) => Promise<void>;
  rejectBuyIn: (buyInId: string) => Promise<void>;
  bulkApprove: () => Promise<void>;
  bulkReject: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Custom hook to manage buy-in approvals for session admins
 */
export function useBuyInApprovals(
  sessionId: string,
  userId: string | undefined,
  members: Member[],
  onDataChange?: () => Promise<void>
): UseBuyInApprovalsReturn {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingBuyIns, setPendingBuyIns] = useState<PendingBuyIn[]>([]);
  const [selectedBuyInIds, setSelectedBuyInIds] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userId) {
        setIsAdmin(false);
        return;
      }

      try {
        const adminStatus = await SessionsRepo.isSessionAdmin(sessionId, userId);
        setIsAdmin(adminStatus);
      } catch (error) {
        logger.error('Error checking admin status', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [sessionId, userId]);

  // Load pending buy-ins
  const loadPendingBuyIns = async () => {
    try {
      const pending = await BuyInsRepo.getPendingBuyIns(sessionId);
      const pendingWithNames = pending.map((buyIn) => {
        const member = members.find((m) => m.id === buyIn.memberId);
        return {
          ...buyIn,
          memberName: member?.name || 'Unknown',
        };
      });
      setPendingBuyIns(pendingWithNames);
    } catch (error) {
      logger.error('Error loading pending buy-ins', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadPendingBuyIns();
    }
  }, [isAdmin, members, sessionId]);

  const reload = async () => {
    await loadPendingBuyIns();
  };

  const toggleSelection = (buyInId: string) => {
    setSelectedBuyInIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(buyInId)) {
        newSet.delete(buyInId);
      } else {
        newSet.add(buyInId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedBuyInIds.size === pendingBuyIns.length) {
      setSelectedBuyInIds(new Set());
    } else {
      setSelectedBuyInIds(new Set(pendingBuyIns.map((b) => b.id)));
    }
  };

  const approveBuyIn = async (buyInId: string) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      await BuyInsRepo.approveBuyIn(buyInId, userId);
      await loadPendingBuyIns();
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      handleError(error, {
        title: 'Approval Failed',
        message: 'Failed to approve buy-in. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const rejectBuyIn = async (buyInId: string) => {
    showConfirmation(
      'Reject Buy-in',
      'Are you sure you want to reject this buy-in?',
      async () => {
        try {
          setIsLoading(true);
          await BuyInsRepo.deleteBuyIn(buyInId);
          await loadPendingBuyIns();
        } catch (error) {
          handleError(error, {
            title: 'Rejection Failed',
            message: 'Failed to reject buy-in. Please try again.',
          });
        } finally {
          setIsLoading(false);
        }
      },
      { destructive: true }
    );
  };

  const bulkApprove = async () => {
    if (selectedBuyInIds.size === 0 || !userId) return;

    showConfirmation(
      'Approve Selected Buy-ins',
      `Approve ${selectedBuyInIds.size} buy-in${
        selectedBuyInIds.size > 1 ? 's' : ''
      }?`,
      async () => {
        try {
          setIsLoading(true);
          const approvalPromises = Array.from(selectedBuyInIds).map((id) =>
            BuyInsRepo.approveBuyIn(id, userId)
          );
          await Promise.all(approvalPromises);
          setSelectedBuyInIds(new Set());
          await loadPendingBuyIns();
          if (onDataChange) {
            await onDataChange();
          }
        } catch (error) {
          handleError(error, {
            title: 'Bulk Approval Failed',
            message: 'Failed to approve some buy-ins. Please try again.',
          });
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const bulkReject = async () => {
    if (selectedBuyInIds.size === 0) return;

    showConfirmation(
      'Reject Selected Buy-ins',
      `Reject ${selectedBuyInIds.size} buy-in${
        selectedBuyInIds.size > 1 ? 's' : ''
      }?`,
      async () => {
        try {
          setIsLoading(true);
          const rejectionPromises = Array.from(selectedBuyInIds).map((id) =>
            BuyInsRepo.deleteBuyIn(id)
          );
          await Promise.all(rejectionPromises);
          setSelectedBuyInIds(new Set());
          await loadPendingBuyIns();
        } catch (error) {
          handleError(error, {
            title: 'Bulk Rejection Failed',
            message: 'Failed to reject some buy-ins. Please try again.',
          });
        } finally {
          setIsLoading(false);
        }
      },
      { destructive: true }
    );
  };

  return {
    isAdmin,
    pendingBuyIns,
    selectedBuyInIds,
    isLoading,
    toggleSelection,
    toggleSelectAll,
    approveBuyIn,
    rejectBuyIn,
    bulkApprove,
    bulkReject,
    reload,
  };
}

export default useBuyInApprovals;
