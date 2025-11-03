import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Checkbox, Divider } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCents, formatDate } from '@/utils/formatters';

interface PendingBuyIn {
  id: string;
  memberId: string;
  memberName: string;
  amountCents: number;
  createdAt: string;
}

interface PendingApprovalsProps {
  pendingBuyIns: PendingBuyIn[];
  selectedBuyInIds: Set<string>;
  isLoading: boolean;
  onToggleSelection: (buyInId: string) => void;
  onToggleSelectAll: () => void;
  onApproveSingle: (buyInId: string) => void;
  onRejectSingle: (buyInId: string) => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
}

export function PendingApprovals({
  pendingBuyIns,
  selectedBuyInIds,
  isLoading,
  onToggleSelection,
  onToggleSelectAll,
  onApproveSingle,
  onRejectSingle,
  onBulkApprove,
  onBulkReject,
}: PendingApprovalsProps) {
  if (pendingBuyIns.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notification Banner */}
      <View style={styles.notificationBanner}>
        <View style={styles.notificationContent}>
          <View style={styles.notificationIconContainer}>
            <Text style={styles.notificationIcon}>⚠️</Text>
          </View>
          <View style={styles.notificationTextContainer}>
            <Text style={styles.notificationTitle}>
              {pendingBuyIns.length} Pending Buy-in
              {pendingBuyIns.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.notificationSubtext}>
              Review and approve buy-ins below
            </Text>
          </View>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Pending Buy-ins Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Pending Buy-ins ({pendingBuyIns.length})
          </Text>
          <Button
            mode="text"
            onPress={onToggleSelectAll}
            compact
            textColor={darkColors.accent}
          >
            {selectedBuyInIds.size === pendingBuyIns.length
              ? 'Deselect All'
              : 'Select All'}
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
                onPress={onBulkApprove}
                disabled={isLoading}
                buttonColor={darkColors.positive}
                compact
                icon="check-all"
              >
                Approve
              </Button>
              <Button
                mode="outlined"
                onPress={onBulkReject}
                disabled={isLoading}
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
          {selectedBuyInIds.size > 0
            ? 'Select buy-ins to approve or reject in bulk'
            : 'Tap checkboxes to select multiple buy-ins'}
        </Text>

        {pendingBuyIns.map((buyIn) => (
          <Card key={buyIn.id} style={styles.pendingCard}>
            <Card.Content>
              <View style={styles.pendingBuyInRow}>
                <Checkbox
                  status={
                    selectedBuyInIds.has(buyIn.id) ? 'checked' : 'unchecked'
                  }
                  onPress={() => onToggleSelection(buyIn.id)}
                  color={darkColors.accent}
                />
                <View style={styles.pendingBuyInInfo}>
                  <Text style={styles.pendingMemberName}>
                    {buyIn.memberName}
                  </Text>
                  <Text style={styles.pendingAmount}>
                    {formatCents(buyIn.amountCents)}
                  </Text>
                  <Text style={styles.pendingTimestamp}>
                    {formatDate(buyIn.createdAt)}
                  </Text>
                </View>
                <View style={styles.pendingActions}>
                  <Button
                    mode="contained"
                    onPress={() => onApproveSingle(buyIn.id)}
                    disabled={isLoading}
                    buttonColor={darkColors.positive}
                    compact
                    style={styles.approveButton}
                  >
                    Approve
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => onRejectSingle(buyIn.id)}
                    disabled={isLoading}
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
  );
}

const styles = StyleSheet.create({
  notificationBanner: {
    backgroundColor: darkColors.warning + '20',
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
  divider: {
    backgroundColor: darkColors.border,
    marginVertical: spacing.md,
  },
  section: {
    padding: spacing.lg,
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
  pendingHint: {
    fontSize: 13,
    color: darkColors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic',
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
});

export default PendingApprovals;
