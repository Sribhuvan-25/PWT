import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Divider,
  DataTable,
} from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSessions } from '@/hooks/useSessions';
import { useMembers } from '@/hooks/useMembers';
import { useBuyIns } from '@/hooks/useBuyIns';
import { useSessionData } from '@/hooks/useSessionData';
import { useBuyInApprovals } from '@/hooks/useBuyInApprovals';
import { useSessionSettlements } from '@/hooks/useSessionSettlements';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCents, formatCentsWithSign } from '@/utils/settleUp';
import * as ResultsRepo from '@/db/repositories/results';
import * as BuyInsRepo from '@/db/repositories/buyins';
import * as SessionsRepo from '@/db/repositories/sessions';
import * as SettlementsRepo from '@/db/repositories/settlements';
import * as NotificationManager from '@/services/notificationManager';
import { calculateSettleUpTransactions } from '@/utils/settleUp';
import { handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';
import BuyInDialog from '@/components/session/BuyInDialog';
import CashoutDialog from '@/components/session/CashoutDialog';
import PendingApprovals from '@/components/session/PendingApprovals';

type RootStackParamList = {
  SessionDetails: { sessionId: string };
};

type SessionDetailsRouteProp = RouteProp<RootStackParamList, 'SessionDetails'>;

export default function SessionDetailsScreen() {
  const route = useRoute<SessionDetailsRouteProp>();
  const navigation = useNavigation();
  const { sessionId } = route.params;

  const { user } = useAuthStore();
  const { sessions, refresh: refreshSessions } = useSessions();
  const { members } = useMembers(sessionId);
  const { buyIns, addBuyIn: addBuyInToDb } = useBuyIns(sessionId);

  // Use custom hooks
  const { memberData, buyInHistory, reload: reloadSessionData } = useSessionData(
    sessionId,
    members,
    buyIns
  );

  const {
    isAdmin,
    pendingBuyIns,
    selectedBuyInIds,
    isLoading: approvalsLoading,
    toggleSelection,
    toggleSelectAll,
    approveBuyIn: approveSingle,
    rejectBuyIn: rejectSingle,
    bulkApprove,
    bulkReject,
  } = useBuyInApprovals(sessionId, user?.id, members, reloadSessionData);

  const {
    settlements: savedSettlements,
    isLoading: settlementsLoading,
    togglePaidStatus,
  } = useSessionSettlements(sessionId, session?.status, user?.id);

  // Local state for dialogs
  const [addBuyInDialogVisible, setAddBuyInDialogVisible] = useState(false);
  const [cashoutDialogVisible, setCashoutDialogVisible] = useState(false);
  const [settlementDialogVisible, setSettlementDialogVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [settlements, setSettlements] = useState<
    Array<{ fromMemberName: string; toMemberName: string; amountCents: number }>
  >([]);

  const session = sessions.find((s) => s.id === sessionId);

  const validateTotals = (): {
    valid: boolean;
    totalBuyIns: number;
    totalCashouts: number;
  } => {
    const totalBuyIns = memberData.reduce((sum, d) => sum + d.totalBuyIns, 0);
    const totalCashouts = memberData.reduce((sum, d) => sum + d.cashout, 0);
    const hasCashouts = memberData.some((d) => d.cashout > 0);

    return {
      valid: !hasCashouts || totalBuyIns === totalCashouts,
      totalBuyIns,
      totalCashouts,
    };
  };

  const canEditMember = (memberId: string): boolean => {
    // Cannot edit if session is completed
    if (session?.status === 'completed') {
      return false;
    }

    // Find the member object to check userId
    const member = members.find((m) => m.id === memberId);
    if (!member || !user) {
      return false;
    }

    // If member has a userId, only that user can edit
    if (member.userId) {
      return member.userId === user.id;
    }

    // If no userId is set on the member, anyone can edit (for backward compatibility)
    return true;
  };

  const handleAddBuyIn = async (amount: number) => {
    if (!selectedMemberId) return;

    try {
      setActionLoading(true);
      await addBuyInToDb(selectedMemberId, Math.round(amount * 100)); // Convert to cents
      setAddBuyInDialogVisible(false);
      await reloadSessionData();
    } catch (error) {
      handleError(error, {
        title: 'Failed to Add Buy-in',
        message: 'Could not add buy-in. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetCashout = async (amount: number) => {
    if (!selectedMemberId) return;

    try {
      setActionLoading(true);
      const amountCents = Math.round(amount * 100);
      const totalBuyIns = await BuyInsRepo.getTotalBuyInsByMember(
        sessionId,
        selectedMemberId
      );
      const netCents = amountCents - totalBuyIns;

      // Check if result already exists
      const existingResult = await ResultsRepo.getResultBySessionAndMember(
        sessionId,
        selectedMemberId
      );

      if (existingResult) {
        await ResultsRepo.updateResult(existingResult.id, netCents, amountCents);
      } else {
        await ResultsRepo.createResult(sessionId, selectedMemberId, netCents, amountCents);
      }

      setCashoutDialogVisible(false);
      await reloadSessionData();
    } catch (error) {
      handleError(error, {
        title: 'Failed to Set Cashout',
        message: 'Could not set cashout. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openAddBuyInDialog = (memberId: string) => {
    setSelectedMemberId(memberId);
    setAddBuyInDialogVisible(true);
  };

  const openCashoutDialog = (memberId: string, currentCashout: number) => {
    setSelectedMemberId(memberId);
    setCashoutDialogVisible(true);
  };

  const handleCompleteSession = () => {
    // Validate totals before completing
    const validation = validateTotals();
    if (!validation.valid) {
      const difference = validation.totalBuyIns - validation.totalCashouts;
      Alert.alert(
        'Validation Error',
        `Total buy-ins and cashouts do not match!\n\n` +
          `Total Buy-ins: ${formatCents(validation.totalBuyIns)}\n` +
          `Total Cashouts: ${formatCents(validation.totalCashouts)}\n` +
          `Difference: ${formatCents(Math.abs(difference))}\n\n` +
          `Please verify all cashout amounts before completing the session.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Calculate settlements
    const balances = memberData.map((data) => ({
      memberId: data.memberId,
      memberName: data.memberName,
      totalCents: data.netResult,
    }));

    const calculated = calculateSettleUpTransactions(balances);
    setSettlements(calculated);
    setSettlementDialogVisible(true);
  };

  const confirmCompleteSession = async () => {
    try {
      setActionLoading(true);

      // Save settlements to database before marking session as completed
      logger.info('Saving settlements to database');
      if (settlements.length > 0) {
        // Find member IDs for each settlement
        const settlementPromises = settlements.map(async (settlement) => {
          const fromMember = members.find((m) => m.name === settlement.fromMemberName);
          const toMember = members.find((m) => m.name === settlement.toMemberName);

          if (!fromMember || !toMember) {
            logger.error('Could not find member IDs for settlement', settlement);
            return;
          }

          return SettlementsRepo.createSettlement(
            sessionId,
            fromMember.id,
            toMember.id,
            settlement.amountCents
          );
        });

        await Promise.all(settlementPromises);
        logger.info('Settlements saved to database');
      }

      // Send notification to all session members (fire and forget)
      NotificationManager.notifySessionCompleted(sessionId).catch((err) =>
        logger.error('Failed to send completion notification', err)
      );

      logger.info('Updating session status to completed');
      await SessionsRepo.updateSessionStatus(sessionId, 'completed');
      logger.info('Session status updated');

      // Force immediate refresh of sessions list
      logger.info('Refreshing sessions list');
      refreshSessions();

      setSettlementDialogVisible(false);

      // Navigate back to sessions list to see the updated status
      navigation.goBack();
      Alert.alert('Success', 'Session marked as completed!');
    } catch (error) {
      handleError(error, {
        title: 'Failed to Complete Session',
        message: 'Could not complete session. Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text>Session not found</Text>
      </View>
    );
  }

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedMemberCashout =
    memberData.find((m) => m.memberId === selectedMemberId)?.cashout || 0;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Session Header */}
        <View style={styles.header}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
          <Text style={styles.joinCode}>Join Code: {session.joinCode}</Text>
          {session.note && <Text style={styles.sessionNote}>{session.note}</Text>}
          <Text style={styles.sessionStatus}>
            Status: {session.status === 'completed' ? 'Completed' : 'Active'}
          </Text>
        </View>

        {/* Pending Approvals Component */}
        {isAdmin && session.status !== 'completed' && (
          <PendingApprovals
            pendingBuyIns={pendingBuyIns}
            selectedBuyInIds={selectedBuyInIds}
            isLoading={approvalsLoading}
            onToggleSelection={toggleSelection}
            onToggleSelectAll={toggleSelectAll}
            onApproveSingle={approveSingle}
            onRejectSingle={rejectSingle}
            onBulkApprove={bulkApprove}
            onBulkReject={bulkReject}
          />
        )}

        {/* Member Data Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>

          {memberData.length === 0 ? (
            <Text style={styles.emptyText}>No participants data yet</Text>
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Player</DataTable.Title>
                <DataTable.Title numeric>Buy-ins</DataTable.Title>
                <DataTable.Title numeric>Cashout</DataTable.Title>
                <DataTable.Title numeric>Net</DataTable.Title>
              </DataTable.Header>

              {memberData.map((data) => {
                const canEdit = canEditMember(data.memberId);
                return (
                  <DataTable.Row key={data.memberId}>
                    <DataTable.Cell>{data.memberName}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Button
                        mode="text"
                        compact
                        onPress={() => openAddBuyInDialog(data.memberId)}
                        textColor={canEdit ? darkColors.accent : darkColors.textMuted}
                        disabled={!canEdit}
                      >
                        {formatCents(data.totalBuyIns)}
                      </Button>
                    </DataTable.Cell>
                    <DataTable.Cell numeric>
                      <Button
                        mode="text"
                        compact
                        onPress={() => openCashoutDialog(data.memberId, data.cashout)}
                        textColor={canEdit ? darkColors.accent : darkColors.textMuted}
                        disabled={!canEdit}
                      >
                        {formatCents(data.cashout)}
                      </Button>
                    </DataTable.Cell>
                    <DataTable.Cell
                      numeric
                      textStyle={{
                        color:
                          data.cashout === 0
                            ? darkColors.textMuted
                            : data.netResult > 0
                            ? darkColors.positive
                            : data.netResult < 0
                            ? darkColors.negative
                            : darkColors.textMuted,
                        fontWeight: data.cashout === 0 ? '400' : '700',
                      }}
                    >
                      {data.cashout === 0 ? '—' : formatCentsWithSign(data.netResult)}
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
          )}

          <Text style={styles.hint}>
            {session?.status === 'completed'
              ? 'Session is completed. No edits allowed.'
              : 'Tap on Buy-ins or Cashout to update values (only your own row)'}
          </Text>
        </View>

        {/* Buy-In History Section */}
        {buyInHistory.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <View style={[styles.section, styles.historySection]}>
              <Text style={styles.sectionTitle}>Buy-In History ({buyInHistory.length})</Text>
              <View style={{ height: 12 }} />
              {buyInHistory.map((buyIn) => (
                <Card
                  key={buyIn.id}
                  style={[styles.historyCard, !buyIn.approved && styles.historyCardPending]}
                >
                  <Card.Content>
                    <View style={styles.historyRow}>
                      <View style={styles.historyInfo}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyMemberName}>{buyIn.memberName}</Text>
                          <View
                            style={[
                              styles.statusBadge,
                              buyIn.approved ? styles.statusApproved : styles.statusPending,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                buyIn.approved
                                  ? styles.statusTextApproved
                                  : styles.statusTextPending,
                              ]}
                            >
                              {buyIn.approved ? '✓ Approved' : '⏱ Pending'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.historyTimestamp}>
                          Added: {formatDate(buyIn.createdAt)}
                        </Text>
                        {buyIn.approved && buyIn.approvedAt && (
                          <Text style={styles.historyApprovalInfo}>
                            Approved: {formatDate(buyIn.approvedAt)}
                            {buyIn.approverName && ` by ${buyIn.approverName}`}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.historyAmount}>{formatCents(buyIn.amountCents)}</Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* Settlements Section - Only for completed sessions */}
        {session.status === 'completed' && savedSettlements.length > 0 && (
          <>
            <Divider style={styles.divider} />
            <View style={[styles.section, styles.historySection]}>
              <Text style={styles.sectionTitle}>Settlements ({savedSettlements.length})</Text>
              <View style={{ height: 12 }} />
              {savedSettlements.map((settlement) => {
                const fromMember = members.find((m) => m.id === settlement.fromMemberId);
                const toMember = members.find((m) => m.id === settlement.toMemberId);
                const paidByMember = settlement.paidBy
                  ? members.find((m) => m.userId === settlement.paidBy)
                  : null;

                return (
                  <Card
                    key={settlement.id}
                    style={[
                      styles.historyCard,
                      !settlement.paid && styles.historyCardPending,
                    ]}
                  >
                    <Card.Content>
                      <View style={styles.historyRow}>
                        <View style={styles.historyInfo}>
                          <View style={styles.historyHeader}>
                            <Text style={styles.historyMemberName}>
                              {fromMember?.name || 'Unknown'} → {toMember?.name || 'Unknown'}
                            </Text>
                            <View
                              style={[
                                styles.statusBadge,
                                settlement.paid ? styles.statusApproved : styles.statusPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  settlement.paid
                                    ? styles.statusTextApproved
                                    : styles.statusTextPending,
                                ]}
                              >
                                {settlement.paid ? '✓ Paid' : '⏱ Unpaid'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.historyTimestamp}>
                            Settled: {formatDate(settlement.settledAt)}
                          </Text>
                          {settlement.paid && settlement.paidAt && (
                            <Text style={styles.historyApprovalInfo}>
                              Paid: {formatDate(settlement.paidAt)}
                              {paidByMember && ` by ${paidByMember.name}`}
                            </Text>
                          )}
                          {settlement.note && (
                            <Text style={styles.historyApprovalInfo}>{settlement.note}</Text>
                          )}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.historyAmount}>
                            {formatCents(settlement.amountCents)}
                          </Text>
                          <Button
                            mode={settlement.paid ? 'outlined' : 'contained'}
                            onPress={() => togglePaidStatus(settlement.id, settlement.paid)}
                            disabled={settlementsLoading}
                            compact
                            style={{ marginTop: spacing.xs }}
                            buttonColor={settlement.paid ? undefined : darkColors.positive}
                          >
                            {settlement.paid ? 'Mark Unpaid' : 'Mark Paid'}
                          </Button>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          </>
        )}

        {/* Complete Session Button - Only for admins */}
        {session.status !== 'completed' && memberData.length > 0 && isAdmin && (
          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={handleCompleteSession}
              style={styles.completeButton}
              contentStyle={styles.completeButtonContent}
            >
              Complete Session & Settle Up
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Buy-in Dialog Component */}
      <BuyInDialog
        visible={addBuyInDialogVisible}
        memberName={selectedMember?.name || ''}
        isLoading={actionLoading}
        onDismiss={() => setAddBuyInDialogVisible(false)}
        onSubmit={handleAddBuyIn}
      />

      {/* Cashout Dialog Component */}
      <CashoutDialog
        visible={cashoutDialogVisible}
        memberName={selectedMember?.name || ''}
        currentCashout={selectedMemberCashout}
        isLoading={actionLoading}
        onDismiss={() => setCashoutDialogVisible(false)}
        onSubmit={handleSetCashout}
      />

      {/* Settlement Dialog */}
      <Modal
        visible={settlementDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettlementDialogVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSettlementDialogVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.settlementContainer}>
                <Text style={styles.settlementDialogTitle}>Complete Session</Text>

                {settlements.length === 0 ? (
                  <Text style={styles.settlementText}>All players are even!</Text>
                ) : (
                  <ScrollView
                    style={styles.settlementScrollView}
                    contentContainerStyle={styles.settlementScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {settlements.map((settlement, index) => (
                      <View key={index} style={styles.settlementItem}>
                        <View style={styles.settlementRow}>
                          <Text style={styles.settlementFrom}>
                            {settlement.fromMemberName}
                          </Text>
                          <Text style={styles.settlementArrow}>→</Text>
                          <Text style={styles.settlementTo}>{settlement.toMemberName}</Text>
                        </View>
                        <Text style={styles.settlementAmount}>
                          {formatCents(settlement.amountCents)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}

                <Text style={styles.settlementNote}>
                  Players can still view details but no new transactions can be added.
                </Text>

                <View style={styles.settlementButtonContainer}>
                  <Button
                    onPress={() => setSettlementDialogVisible(false)}
                    disabled={actionLoading}
                    textColor={darkColors.textMuted}
                    style={styles.settlementCancelButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={confirmCompleteSession}
                    loading={actionLoading}
                    disabled={actionLoading}
                    mode="contained"
                    buttonColor={darkColors.positive}
                    style={styles.settlementConfirmButton}
                  >
                    Mark as Completed
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: darkColors.card,
  },
  sessionName: {
    fontSize: 24,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  sessionDate: {
    fontSize: 16,
    color: darkColors.textMuted,
    marginBottom: spacing.xs,
  },
  joinCode: {
    fontSize: 14,
    color: darkColors.accent,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  sessionNote: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.xs,
  },
  sessionStatus: {
    fontSize: 14,
    color: darkColors.accent,
  },
  divider: {
    backgroundColor: darkColors.border,
    marginVertical: spacing.md,
  },
  section: {
    padding: spacing.lg,
  },
  historySection: {
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  hint: {
    fontSize: 12,
    color: darkColors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: darkColors.positive,
  },
  completeButtonContent: {
    paddingVertical: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settlementContainer: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: spacing.lg,
    width: '90%',
    maxHeight: '70%',
  },
  settlementDialogTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.lg,
  },
  settlementScrollView: {
    maxHeight: 200,
    marginBottom: spacing.lg,
  },
  settlementScrollContent: {
    paddingVertical: spacing.xs,
  },
  settlementText: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.positive,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  settlementItem: {
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  settlementFrom: {
    fontSize: 15,
    fontWeight: '500',
    color: darkColors.textPrimary,
    flex: 1,
  },
  settlementArrow: {
    fontSize: 18,
    color: darkColors.accent,
    marginHorizontal: spacing.md,
  },
  settlementTo: {
    fontSize: 15,
    fontWeight: '500',
    color: darkColors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  settlementAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: darkColors.accent,
    textAlign: 'center',
  },
  settlementNote: {
    fontSize: 13,
    color: darkColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  settlementButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.sm,
  },
  settlementCancelButton: {
    minWidth: 80,
  },
  settlementConfirmButton: {
    minWidth: 120,
  },
  historyCard: {
    backgroundColor: darkColors.card,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.positive,
  },
  historyCardPending: {
    borderLeftColor: darkColors.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  historyMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: darkColors.positive + '20',
  },
  statusPending: {
    backgroundColor: darkColors.textMuted + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusTextApproved: {
    color: darkColors.positive,
  },
  statusTextPending: {
    color: darkColors.textMuted,
  },
  historyTimestamp: {
    fontSize: 12,
    color: darkColors.textMuted,
    marginBottom: 2,
  },
  historyApprovalInfo: {
    fontSize: 11,
    color: darkColors.textMuted,
    fontStyle: 'italic',
  },
  historyAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: darkColors.accent,
  },
});
