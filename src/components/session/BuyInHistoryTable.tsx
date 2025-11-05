import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCents, formatDate } from '@/utils/formatters';

export interface BuyInHistoryItem {
  id: string;
  memberName: string;
  amountCents: number;
  createdAt: string;
  approved: boolean;
  approvedAt?: string;
  approverName?: string;
}

interface BuyInHistoryTableProps {
  buyInHistory: BuyInHistoryItem[];
}

export function BuyInHistoryTable({ buyInHistory }: BuyInHistoryTableProps) {
  if (buyInHistory.length === 0) {
    return null;
  }

  return (
    <>
      <Divider style={styles.divider} />
      <View style={[styles.section, styles.historySection]}>
        <Text style={styles.sectionTitle}>
          Buy-In History ({buyInHistory.length})
        </Text>
        <View style={{ height: 12 }} />
        {buyInHistory.map((buyIn) => (
          <Card
            key={buyIn.id}
            style={[
              styles.historyCard,
              !buyIn.approved && styles.historyCardPending,
            ]}
          >
            <Card.Content>
              <View style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyMemberName}>
                      {buyIn.memberName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        buyIn.approved
                          ? styles.statusApproved
                          : styles.statusPending,
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
                <Text style={styles.historyAmount}>
                  {formatCents(buyIn.amountCents)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: darkColors.border,
    marginVertical: spacing.md,
  },
  section: {
    padding: spacing.lg,
  },
  historySection: {
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
  },
  historyCard: {
    backgroundColor: darkColors.card,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.positive,
  },
  historyCardPending: {
    borderLeftColor: darkColors.warning,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  statusApproved: {
    backgroundColor: darkColors.positive + '20',
  },
  statusPending: {
    backgroundColor: darkColors.warning + '20',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextApproved: {
    color: darkColors.positive,
  },
  statusTextPending: {
    color: darkColors.warning,
  },
  historyTimestamp: {
    fontSize: 12,
    color: darkColors.textMuted,
    marginBottom: 2,
  },
  historyApprovalInfo: {
    fontSize: 12,
    color: darkColors.textSecondary,
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: darkColors.accent,
  },
});

export default BuyInHistoryTable;
