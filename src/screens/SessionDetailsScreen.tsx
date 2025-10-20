import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import {
  Text,
  Card,
  Button,
  Portal,
  Dialog,
  TextInput,
  Divider,
  ActivityIndicator,
  DataTable,
  Checkbox,
} from 'react-native-paper';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSessions } from '@/hooks/useSessions';
import { useMembers } from '@/hooks/useMembers';
import { useBuyIns } from '@/hooks/useBuyIns';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCents, formatCentsWithSign } from '@/utils/settleUp';
import * as ResultsRepo from '@/db/repositories/results';
import * as BuyInsRepo from '@/db/repositories/buyins';
import * as SessionsRepo from '@/db/repositories/sessions';
import { calculateSettleUpTransactions } from '@/utils/settleUp';

type RootStackParamList = {
  SessionDetails: { sessionId: string };
};

type SessionDetailsRouteProp = RouteProp<RootStackParamList, 'SessionDetails'>;

interface MemberSessionData {
  memberId: string;
  memberName: string;
  totalBuyIns: number;
  cashout: number;
  netResult: number;
}

export default function SessionDetailsScreen() {
  const route = useRoute<SessionDetailsRouteProp>();
  const navigation = useNavigation();
  const { sessionId } = route.params;

  const { user } = useAuthStore();
  const { sessions, refresh: refreshSessions } = useSessions();
  const { members } = useMembers(sessionId);
  const { buyIns, addBuyIn } = useBuyIns(sessionId);

  const [addBuyInDialogVisible, setAddBuyInDialogVisible] = useState(false);
  const [cashoutDialogVisible, setCashoutDialogVisible] = useState(false);
  const [settlementDialogVisible, setSettlementDialogVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [buyInAmount, setBuyInAmount] = useState('');
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [memberData, setMemberData] = useState<MemberSessionData[]>([]);
  const [settlements, setSettlements] = useState<Array<{ fromMemberName: string; toMemberName: string; amountCents: number }>>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingBuyIns, setPendingBuyIns] = useState<Array<any>>([]);
  const [buyInHistory, setBuyInHistory] = useState<Array<any>>([]);
  const [selectedBuyInIds, setSelectedBuyInIds] = useState<Set<string>>(new Set());

  const session = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    loadMemberData();
    loadBuyInHistory();
    if (isAdmin) {
      loadPendingBuyIns();
    }
  }, [buyIns, members, sessionId, isAdmin]);

  useEffect(() => {
    checkAdminStatus();
  }, [sessionId, user]);

  const checkAdminStatus = async () => {
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }

    try {
      const adminStatus = await SessionsRepo.isSessionAdmin(sessionId, user.id);
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadMemberData = async () => {
    const data: MemberSessionData[] = [];

    for (const member of members) {
      const totalBuyIns = await BuyInsRepo.getTotalBuyInsByMember(sessionId, member.id);
      const result = await ResultsRepo.getResultBySessionAndMember(sessionId, member.id);
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
  };

  const loadPendingBuyIns = async () => {
    try {
      const pending = await BuyInsRepo.getPendingBuyIns(sessionId);
      const pendingWithNames = pending.map(buyIn => {
        const member = members.find(m => m.id === buyIn.memberId);
        return {
          ...buyIn,
          memberName: member?.name || 'Unknown',
        };
      });
      setPendingBuyIns(pendingWithNames);
    } catch (error) {
      console.error('Error loading pending buy-ins:', error);
    }
  };

  const loadBuyInHistory = () => {
    try {
      // Map all buy-ins with member names and approver names
      const historyWithNames = buyIns.map(buyIn => {
        const member = members.find(m => m.id === buyIn.memberId);
        const approver = buyIn.approvedBy ? members.find(m => m.userId === buyIn.approvedBy) : null;
        return {
          ...buyIn,
          memberName: member?.name || 'Unknown',
          approverName: approver?.name || (buyIn.approvedBy ? 'Unknown' : null),
        };
      });
      // Sort by creation date, newest first
      const sorted = historyWithNames.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setBuyInHistory(sorted);
    } catch (error) {
      console.error('Error loading buy-in history:', error);
    }
  };

  const handleApproveBuyIn = async (buyInId: string) => {
    if (!user?.id) return;

    try {
      setActionLoading(true);
      await BuyInsRepo.approveBuyIn(buyInId, user.id);
      await loadPendingBuyIns();
      await loadMemberData();
      Alert.alert('Success', 'Buy-in approved!');
    } catch (error) {
      console.error('Error approving buy-in:', error);
      Alert.alert('Error', 'Failed to approve buy-in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectBuyIn = async (buyInId: string) => {
    Alert.alert(
      'Reject Buy-in',
      'Are you sure you want to reject this buy-in?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await BuyInsRepo.deleteBuyIn(buyInId);
              await loadPendingBuyIns();
              Alert.alert('Success', 'Buy-in rejected');
            } catch (error) {
              console.error('Error rejecting buy-in:', error);
              Alert.alert('Error', 'Failed to reject buy-in');
            }
          },
        },
      ]
    );
  };

  const toggleBuyInSelection = (buyInId: string) => {
    setSelectedBuyInIds(prev => {
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
      setSelectedBuyInIds(new Set(pendingBuyIns.map(b => b.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedBuyInIds.size === 0 || !user?.id) return;

    Alert.alert(
      'Approve Selected Buy-ins',
      `Approve ${selectedBuyInIds.size} buy-in${selectedBuyInIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setActionLoading(true);
              const approvalPromises = Array.from(selectedBuyInIds).map(id =>
                BuyInsRepo.approveBuyIn(id, user.id)
              );
              await Promise.all(approvalPromises);
              setSelectedBuyInIds(new Set());
              await loadPendingBuyIns();
              await loadMemberData();
              Alert.alert('Success', `${selectedBuyInIds.size} buy-in${selectedBuyInIds.size > 1 ? 's' : ''} approved!`);
            } catch (error) {
              console.error('Error bulk approving buy-ins:', error);
              Alert.alert('Error', 'Failed to approve some buy-ins');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBulkReject = async () => {
    if (selectedBuyInIds.size === 0) return;

    Alert.alert(
      'Reject Selected Buy-ins',
      `Reject ${selectedBuyInIds.size} buy-in${selectedBuyInIds.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const rejectionPromises = Array.from(selectedBuyInIds).map(id =>
                BuyInsRepo.deleteBuyIn(id)
              );
              await Promise.all(rejectionPromises);
              setSelectedBuyInIds(new Set());
              await loadPendingBuyIns();
              Alert.alert('Success', `${selectedBuyInIds.size} buy-in${selectedBuyInIds.size > 1 ? 's' : ''} rejected`);
            } catch (error) {
              console.error('Error bulk rejecting buy-ins:', error);
              Alert.alert('Error', 'Failed to reject some buy-ins');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const validateTotals = (): { valid: boolean; totalBuyIns: number; totalCashouts: number } => {
    const totalBuyIns = memberData.reduce((sum, d) => sum + d.totalBuyIns, 0);
    const totalCashouts = memberData.reduce((sum, d) => sum + d.cashout, 0);
    const hasCashouts = memberData.some(d => d.cashout > 0);

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
    const member = members.find(m => m.id === memberId);
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

  const handleAddBuyIn = async () => {
    if (!selectedMemberId || !buyInAmount.trim()) return;

    const amount = parseFloat(buyInAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid buy-in amount');
      return;
    }

    try {
      setActionLoading(true);
      await addBuyIn(selectedMemberId, Math.round(amount * 100)); // Convert to cents
      setBuyInAmount('');
      setAddBuyInDialogVisible(false);
      await loadMemberData();
      Alert.alert('Success', 'Buy-in added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add buy-in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetCashout = async () => {
    if (!selectedMemberId || !cashoutAmount.trim()) return;

    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid cashout amount');
      return;
    }

    try {
      setActionLoading(true);
      const amountCents = Math.round(amount * 100);
      const totalBuyIns = await BuyInsRepo.getTotalBuyInsByMember(sessionId, selectedMemberId);
      const netCents = amountCents - totalBuyIns;

      // Check if result already exists
      const existingResult = await ResultsRepo.getResultBySessionAndMember(sessionId, selectedMemberId);
      
      if (existingResult) {
        await ResultsRepo.updateResult(existingResult.id, netCents, amountCents);
      } else {
        await ResultsRepo.createResult(sessionId, selectedMemberId, netCents, amountCents);
      }

      setCashoutAmount('');
      setCashoutDialogVisible(false);
      await loadMemberData();
      Alert.alert('Success', 'Cashout recorded!');
    } catch (error) {
      Alert.alert('Error', 'Failed to record cashout');
    } finally {
      setActionLoading(false);
    }
  };

  const openAddBuyInDialog = (memberId: string) => {
    setSelectedMemberId(memberId);
    setBuyInAmount('');
    setAddBuyInDialogVisible(true);
  };

  const openCashoutDialog = (memberId: string, currentCashout: number) => {
    setSelectedMemberId(memberId);
    setCashoutAmount(currentCashout > 0 ? (currentCashout / 100).toString() : '');
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
      console.log('🔄 Updating session status to completed...');
      await SessionsRepo.updateSessionStatus(sessionId, 'completed');
      console.log('✅ Session status updated');

      // Force immediate refresh of sessions list
      console.log('🔄 Refreshing sessions list...');
      refreshSessions();
      console.log('✅ Sessions refresh triggered');

      setSettlementDialogVisible(false);

      // Navigate back to sessions list to see the updated status
      navigation.goBack();
      Alert.alert('Success', 'Session marked as completed!');
    } catch (error) {
      console.error('Error completing session:', error);
      Alert.alert('Error', 'Failed to complete session');
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

        {/* Notification Banner for Pending Buy-ins */}
        {isAdmin && pendingBuyIns.length > 0 && session.status !== 'completed' && (
          <View style={styles.notificationBanner}>
            <View style={styles.notificationContent}>
              <View style={styles.notificationIconContainer}>
                <Text style={styles.notificationIcon}>⚠️</Text>
              </View>
              <View style={styles.notificationTextContainer}>
                <Text style={styles.notificationTitle}>
                  {pendingBuyIns.length} Pending Buy-in{pendingBuyIns.length > 1 ? 's' : ''}
                </Text>
                <Text style={styles.notificationSubtext}>
                  Review and approve buy-ins below
                </Text>
              </View>
            </View>
          </View>
        )}

        <Divider style={styles.divider} />

        {/* Pending Buy-ins Section - Only for Admins */}
        {isAdmin && pendingBuyIns.length > 0 && session.status !== 'completed' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pending Buy-ins ({pendingBuyIns.length})</Text>
                <Button
                  mode="text"
                  onPress={toggleSelectAll}
                  compact
                  textColor={darkColors.accent}
                >
                  {selectedBuyInIds.size === pendingBuyIns.length ? 'Deselect All' : 'Select All'}
                </Button>
              </View>

              {selectedBuyInIds.size > 0 && (
                <View style={styles.bulkActions}>
                  <Text style={styles.bulkActionsText}>
                    {selectedBuyInIds.size} selected
                  </Text>
                  <View style={styles.bulkActionsButtons}>
                    <Button
                      mode="contained"
                      onPress={handleBulkApprove}
                      disabled={actionLoading}
                      buttonColor={darkColors.positive}
                      compact
                      icon="check-all"
                    >
                      Approve
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={handleBulkReject}
                      disabled={actionLoading}
                      textColor={darkColors.negative}
                      compact
                      icon="close-circle-outline"
                      style={styles.bulkRejectButton}
                    >
                      Reject
                    </Button>
                  </View>
                </View>
              )}

              <Text style={styles.pendingHint}>
                {selectedBuyInIds.size > 0 ? 'Select buy-ins to approve or reject in bulk' : 'Tap checkboxes to select multiple buy-ins'}
              </Text>

              {pendingBuyIns.map((buyIn) => (
                <Card key={buyIn.id} style={styles.pendingCard}>
                  <Card.Content>
                    <View style={styles.pendingBuyInRow}>
                      <Checkbox
                        status={selectedBuyInIds.has(buyIn.id) ? 'checked' : 'unchecked'}
                        onPress={() => toggleBuyInSelection(buyIn.id)}
                        color={darkColors.accent}
                      />
                      <View style={styles.pendingBuyInInfo}>
                        <Text style={styles.pendingMemberName}>{buyIn.memberName}</Text>
                        <Text style={styles.pendingAmount}>{formatCents(buyIn.amountCents)}</Text>
                        <Text style={styles.pendingTimestamp}>{formatDate(buyIn.createdAt)}</Text>
                      </View>
                      <View style={styles.pendingActions}>
                        <Button
                          mode="contained"
                          onPress={() => handleApproveBuyIn(buyIn.id)}
                          disabled={actionLoading}
                          buttonColor={darkColors.positive}
                          compact
                          style={styles.approveButton}
                        >
                          Approve
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleRejectBuyIn(buyIn.id)}
                          disabled={actionLoading}
                          textColor={darkColors.negative}
                          compact
                          style={styles.rejectButton}
                        >
                          Reject
                        </Button>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
            <Divider style={styles.divider} />
          </>
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
                <Card key={buyIn.id} style={[
                  styles.historyCard,
                  !buyIn.approved && styles.historyCardPending
                ]}>
                  <Card.Content>
                    <View style={styles.historyRow}>
                      <View style={styles.historyInfo}>
                        <View style={styles.historyHeader}>
                          <Text style={styles.historyMemberName}>{buyIn.memberName}</Text>
                          <View style={[
                            styles.statusBadge,
                            buyIn.approved ? styles.statusApproved : styles.statusPending
                          ]}>
                            <Text style={[
                              styles.statusText,
                              buyIn.approved ? styles.statusTextApproved : styles.statusTextPending
                            ]}>
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

      {/* Add Buy-in Dialog */}
      <Portal>
        <Dialog visible={addBuyInDialogVisible} onDismiss={() => setAddBuyInDialogVisible(false)}>
          <Dialog.Title>Add Buy-in</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Adding buy-in for: {selectedMember?.name}
            </Text>
            <TextInput
              label="Amount"
              value={buyInAmount}
              onChangeText={setBuyInAmount}
              mode="outlined"
              placeholder="100"
              keyboardType="numeric"
              left={<TextInput.Affix text="$" />}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddBuyInDialogVisible(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onPress={handleAddBuyIn} loading={actionLoading} disabled={actionLoading}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Set Cashout Dialog */}
      <Portal>
        <Dialog visible={cashoutDialogVisible} onDismiss={() => setCashoutDialogVisible(false)}>
          <Dialog.Title>Set Cashout</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Cashout amount for: {selectedMember?.name}
            </Text>
            <TextInput
              label="Cashout Amount"
              value={cashoutAmount}
              onChangeText={setCashoutAmount}
              mode="outlined"
              placeholder="250"
              keyboardType="numeric"
              left={<TextInput.Affix text="$" />}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCashoutDialogVisible(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onPress={handleSetCashout} loading={actionLoading} disabled={actionLoading}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
                          <Text style={styles.settlementFrom}>{settlement.fromMemberName}</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  card: {
    backgroundColor: darkColors.card,
    marginBottom: spacing.sm,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: darkColors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: darkColors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: darkColors.accent,
  },
  dialogText: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.md,
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
  pendingCard: {
    backgroundColor: darkColors.card,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.warning,
  },
  pendingBuyInRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingBuyInInfo: {
    flex: 1,
  },
  pendingMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: 4,
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: darkColors.accent,
    marginBottom: 4,
  },
  pendingTimestamp: {
    fontSize: 12,
    color: darkColors.textMuted,
  },
  pendingActions: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginLeft: spacing.md,
  },
  approveButton: {
    minWidth: 90,
  },
  rejectButton: {
    minWidth: 90,
    borderColor: darkColors.negative,
  },
  pendingHint: {
    fontSize: 13,
    color: darkColors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  notificationBanner: {
    backgroundColor: darkColors.warning + '20', // 20% opacity
    borderLeftWidth: 4,
    borderLeftColor: darkColors.warning,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIconContainer: {
    marginRight: spacing.md,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.warning,
    marginBottom: 2,
  },
  notificationSubtext: {
    fontSize: 13,
    color: darkColors.textMuted,
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
  bulkActions: {
    backgroundColor: darkColors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bulkActionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: darkColors.textPrimary,
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulkRejectButton: {
    borderColor: darkColors.negative,
  },
});

