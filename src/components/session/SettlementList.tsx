import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Button, Divider } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCents, formatDate } from '@/utils/formatters';

export interface Member {
  id: string;
  name: string;
  userId: string;
}

export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  settledAt: string;
  paid: boolean;
  paidAt?: string;
  paidBy?: string;
  note?: string;
}

interface SettlementListProps {
  settlements: Settlement[];
  members: Member[];
  isLoading: boolean;
  onTogglePaid: (settlementId: string, currentPaidStatus: boolean) => void;
}

export function SettlementList({
  settlements,
  members,
  isLoading,
  onTogglePaid,
}: SettlementListProps) {
  if (settlements.length === 0) {
    return null;
  }

  return (
    <>
      <Divider style={styles.divider} />
      <View style={[styles.section, styles.historySection]}>
        <Text style={styles.sectionTitle}>
          Settlements ({settlements.length})
        </Text>
        <View style={{ height: 12 }} />
        {settlements.map((settlement) => {
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
                          settlement.paid
                            ? styles.statusApproved
                            : styles.statusPending,
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
                      <Text style={styles.historyApprovalInfo}>
                        {settlement.note}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.historyAmount}>
                      {formatCents(settlement.amountCents)}
                    </Text>
                    <Button
                      mode={settlement.paid ? 'outlined' : 'contained'}
                      onPress={() => onTogglePaid(settlement.id, settlement.paid)}
                      disabled={isLoading}
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

export default SettlementList;
