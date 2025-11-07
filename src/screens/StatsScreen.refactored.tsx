import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCentsWithSign, parseDollarsToCents } from '@/utils/settleUp';
import * as ManualAdjustmentsRepo from '@/db/repositories/manualAdjustments';
import { useAuthStore } from '@/stores/authStore';
import CashFlowChart from '@/components/CashFlowChart';
import ProfitLossGraph from '@/components/ProfitLossGraph';
import { ManualAdjustmentDialog } from '@/components/stats/ManualAdjustmentDialog';
import { SessionHistoryList } from '@/components/stats/SessionHistoryList';
import { ErrorHandler } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export default function StatsScreen() {
  const { stats, loading, refreshing, refresh } = usePlayerStats();
  const { user } = useAuthStore();
  const [adjustmentModalVisible, setAdjustmentModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const getResultColor = (netCents: number) => {
    if (netCents > 0) return darkColors.positive;
    if (netCents < 0) return darkColors.negative;
    return darkColors.textMuted;
  };

  const handleAddAdjustment = async (adjustmentAmount: string, adjustmentNote: string) => {
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
      await refresh();
    } catch (error) {
      ErrorHandler.handle(error, {
        title: 'Failed to Add Adjustment',
        message: 'Could not add manual adjustment. Please try again.',
      });
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
              ErrorHandler.handle(error, {
                title: 'Failed to Delete Adjustment',
                message: 'Could not delete adjustment. Please try again.',
              });
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

      {/* Cash Flow Visualization */}
      {stats.sessionHistory.length > 0 && (
        <CashFlowChart
          sessionHistory={stats.sessionHistory}
          totalAdjustmentsCents={stats.totalAdjustmentsCents}
        />
      )}

      {/* Profit/Loss Trends */}
      {stats.sessionHistory.length > 0 && (
        <ProfitLossGraph sessionHistory={stats.sessionHistory} />
      )}

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

      <SessionHistoryList
        sessionHistory={stats.sessionHistory}
        loading={loading}
        refreshing={refreshing}
        onRefresh={refresh}
      />

      {/* Add Adjustment Modal */}
      <ManualAdjustmentDialog
        visible={adjustmentModalVisible}
        isLoading={actionLoading}
        onDismiss={() => setAdjustmentModalVisible(false)}
        onSubmit={handleAddAdjustment}
      />
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
});
