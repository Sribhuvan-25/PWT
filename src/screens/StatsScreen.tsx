import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity, Modal, TextInput as RNTextInput } from 'react-native';
import { Text, Card, Button, TextInput, IconButton } from 'react-native-paper';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCentsWithSign, formatCents, parseDollarsToCents } from '@/utils/settleUp';
import * as ManualAdjustmentsRepo from '@/db/repositories/manualAdjustments';
import { useAuthStore } from '@/stores/authStore';

export default function StatsScreen() {
  const { stats, loading, refreshing, refresh } = usePlayerStats();
  const { user } = useAuthStore();
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const getResultColor = (netCents: number) => {
    if (netCents > 0) return darkColors.positive;
    if (netCents < 0) return darkColors.negative;
    return darkColors.textMuted;
  };

  const handleAddAdjustment = async () => {
    if (!user) return;

    const amountCents = parseDollarsToCents(adjustmentAmount);
    if (isNaN(amountCents) || amountCents === 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setActionLoading(true);
      await ManualAdjustmentsRepo.createAdjustment(user.id, amountCents, adjustmentNote || undefined);
      setAdjustmentModalVisible(false);
      setAdjustmentAmount('');
      setAdjustmentNote('');
      await refresh();
    } catch (error) {
      console.error('Error adding adjustment:', error);
      Alert.alert('Error', 'Failed to add adjustment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdjustment = (id: string, amount: number) => {
    Alert.alert(
      'Delete Adjustment',
      `Remove ${formatCentsWithSign(amount)} adjustment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ManualAdjustmentsRepo.deleteAdjustment(id);
              await refresh();
            } catch (error) {
              console.error('Error deleting adjustment:', error);
              Alert.alert('Error', 'Failed to delete adjustment');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - Net Profit/Loss */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Total Net Result</Text>
        <Text
          style={[
            styles.totalAmount,
            { color: getResultColor(stats.totalNetCents) },
          ]}
        >
          {formatCentsWithSign(stats.totalNetCents)}
        </Text>
        <Text style={styles.headerSubtext}>
          {stats.totalNetCents >= 0 ? 'Net Profit' : 'Net Loss'}
        </Text>
      </View>

      {/* Manual Adjustments Section */}
      {stats.adjustments.length > 0 && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manual Adjustments</Text>
              <Text style={[styles.adjustmentTotal, { color: getResultColor(stats.totalAdjustmentsCents) }]}>
                {formatCentsWithSign(stats.totalAdjustmentsCents)}
              </Text>
            </View>
          </View>
          <View style={styles.adjustmentsList}>
            {stats.adjustments.map((adj) => (
              <View key={adj.id} style={styles.adjustmentItem}>
                <View style={styles.adjustmentInfo}>
                  {adj.note && <Text style={styles.adjustmentNote}>{adj.note}</Text>}
                  <Text style={styles.adjustmentDate}>{formatDate(adj.createdAt)}</Text>
                </View>
                <View style={styles.adjustmentRight}>
                  <Text style={[styles.adjustmentAmount, { color: getResultColor(adj.amountCents) }]}>
                    {formatCentsWithSign(adj.amountCents)}
                  </Text>
                  <IconButton
                    icon="delete-outline"
                    size={20}
                    iconColor={darkColors.negative}
                    onPress={() => handleDeleteAdjustment(adj.id, adj.amountCents)}
                  />
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.section}>
        <Button
          mode="outlined"
          onPress={() => setAdjustmentModalVisible(true)}
          style={styles.addAdjustmentButton}
          icon="plus"
        >
          Add Manual Adjustment
        </Button>
      </View>

      {/* Session History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game History</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Loading stats...</Text>
        </View>
      ) : stats.sessionHistory.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No game history yet</Text>
          <Text style={styles.emptySubtext}>
            Join groups and play sessions to see your stats!
          </Text>
        </View>
      ) : (
        <FlatList
          data={stats.sessionHistory}
          keyExtractor={(item) => `${item.sessionId}-${item.date}`}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={darkColors.accent}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.groupName}>{item.groupName}</Text>
                    <Text style={styles.date}>{formatDate(item.date)}</Text>
                    {item.note && (
                      <Text style={styles.note}>{item.note}</Text>
                    )}
                  </View>
                  <View style={styles.resultContainer}>
                    <Text
                      style={[
                        styles.result,
                        { color: getResultColor(item.netCents) },
                      ]}
                    >
                      {formatCentsWithSign(item.netCents)}
                    </Text>
                    <Text
                      style={[
                        styles.resultLabel,
                        { color: getResultColor(item.netCents) },
                      ]}
                    >
                      {item.netCents > 0
                        ? 'Win'
                        : item.netCents < 0
                        ? 'Loss'
                        : 'Break Even'}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}

      {/* Add Adjustment Modal */}
      <Modal
        visible={adjustmentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdjustmentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAdjustmentModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Manual Adjustment</Text>
              <Text style={styles.modalDescription}>
                Add or subtract from your total P/L. Use negative amounts for losses.
              </Text>

              <TextInput
                label="Amount (e.g., -50 or 100)"
                value={adjustmentAmount}
                onChangeText={setAdjustmentAmount}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                placeholder="0.00"
                outlineColor={darkColors.border}
                activeOutlineColor={darkColors.accent}
                textColor={darkColors.textPrimary}
              />

              <TextInput
                label="Note (optional)"
                value={adjustmentNote}
                onChangeText={setAdjustmentNote}
                mode="outlined"
                style={styles.input}
                placeholder="Reason for adjustment"
                outlineColor={darkColors.border}
                activeOutlineColor={darkColors.accent}
                textColor={darkColors.textPrimary}
              />

              <View style={styles.modalButtons}>
                <Button
                  onPress={() => setAdjustmentModalVisible(false)}
                  disabled={actionLoading}
                  textColor={darkColors.textMuted}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleAddAdjustment}
                  loading={actionLoading}
                  disabled={actionLoading || !adjustmentAmount}
                  mode="contained"
                  buttonColor={darkColors.accent}
                  style={styles.modalButton}
                >
                  Add
                </Button>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: darkColors.card,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  headerLabel: {
    fontSize: 14,
    color: darkColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtext: {
    fontSize: 16,
    color: darkColors.textMuted,
  },
  section: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.card,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: 2,
  },
  note: {
    fontSize: 12,
    color: darkColors.textMuted,
    fontStyle: 'italic',
  },
  resultContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  result: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adjustmentTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  adjustmentsList: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  adjustmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  adjustmentInfo: {
    flex: 1,
  },
  adjustmentNote: {
    fontSize: 14,
    color: darkColors.textPrimary,
    marginBottom: 4,
  },
  adjustmentDate: {
    fontSize: 12,
    color: darkColors.textMuted,
  },
  adjustmentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  adjustmentAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  addAdjustmentButton: {
    borderColor: darkColors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: spacing.xl,
    width: 340,
    maxWidth: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    minWidth: 80,
  },
});

