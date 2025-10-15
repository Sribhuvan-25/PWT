import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
} from 'react-native-paper';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useSessions } from '@/hooks/useSessions';
import { useMembers } from '@/hooks/useMembers';
import { useBuyIns } from '@/hooks/useBuyIns';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCents } from '@/utils/settleUp';
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

  const session = sessions.find((s) => s.id === sessionId);

  useEffect(() => {
    loadMemberData();
  }, [buyIns, members, sessionId]);

  const loadMemberData = async () => {
    const data: MemberSessionData[] = [];

    for (const member of members) {
      const totalBuyIns = await BuyInsRepo.getTotalBuyInsByMember(sessionId, member.id);
      const result = await ResultsRepo.getResultBySessionAndMember(sessionId, member.id);
      const cashout = result?.cashoutCents || 0;
      const netResult = cashout - totalBuyIns;

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
      await SessionsRepo.updateSessionStatus(sessionId, 'completed');
      await refreshSessions(); // Refresh to get updated session status
      setSettlementDialogVisible(false);
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

        <Divider style={styles.divider} />

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
                          data.netResult > 0
                            ? darkColors.positive
                            : data.netResult < 0
                            ? darkColors.negative
                            : darkColors.textMuted,
                        fontWeight: '700',
                      }}
                    >
                      {formatCents(data.netResult)}
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

        {/* Complete Session Button */}
        {session.status !== 'completed' && memberData.length > 0 && (
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
      <Portal>
        <Dialog
          visible={settlementDialogVisible}
          onDismiss={() => setSettlementDialogVisible(false)}
          style={styles.settlementDialog}
        >
          <Dialog.Title>Complete Session</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text style={styles.settlementTitle}>Settlement Summary</Text>
              <Text style={styles.settlementSubtitle}>
                These transactions will settle all debts:
              </Text>

              {settlements.length === 0 ? (
                <Text style={styles.settlementText}>All players are even!</Text>
              ) : (
                settlements.map((settlement, index) => (
                  <Card key={index} style={styles.settlementCard}>
                    <Card.Content>
                      <View style={styles.settlementRow}>
                        <Text style={styles.settlementFrom}>{settlement.fromMemberName}</Text>
                        <Text style={styles.settlementArrow}>→</Text>
                        <Text style={styles.settlementTo}>{settlement.toMemberName}</Text>
                      </View>
                      <Text style={styles.settlementAmount}>
                        {formatCents(settlement.amountCents)}
                      </Text>
                    </Card.Content>
                  </Card>
                ))
              )}

              <Text style={styles.settlementNote}>
                Mark this session as completed? Players can still view the details but no new transactions can be added.
              </Text>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setSettlementDialogVisible(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onPress={confirmCompleteSession}
              loading={actionLoading}
              disabled={actionLoading}
              mode="contained"
            >
              Mark as Completed
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
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
  settlementDialog: {
    maxHeight: '80%',
  },
  settlementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  settlementSubtitle: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.lg,
  },
  settlementText: {
    fontSize: 16,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  settlementCard: {
    backgroundColor: darkColors.card,
    marginBottom: spacing.md,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  settlementFrom: {
    fontSize: 14,
    fontWeight: '600',
    color: darkColors.textPrimary,
    flex: 1,
  },
  settlementArrow: {
    fontSize: 18,
    color: darkColors.accent,
    marginHorizontal: spacing.sm,
  },
  settlementTo: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 12,
    color: darkColors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});

