import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { useBalances } from '@/hooks/useBalances';
import { useSettlements } from '@/hooks/useSettlements';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatCentsWithSign, formatCents } from '@/utils/settleUp';

export default function BalancesScreen() {
  const { selectedGroupId } = useAppStore();
  const { user } = useAuthStore();
  const { balances, settleUp, loading, refresh } = useBalances(selectedGroupId);
  const { recordSettlement } = useSettlements(selectedGroupId);
  const [settling, setSettling] = useState<{ [key: string]: boolean }>({});

  const handleMarkAsSettled = async (
    fromMemberId: string,
    toMemberId: string,
    amountCents: number,
    index: number
  ) => {
    Alert.alert(
      'Confirm Settlement',
      `Mark ${formatCents(amountCents)} as settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setSettling({ ...settling, [index]: true });
              await recordSettlement(fromMemberId, toMemberId, amountCents, 'Debt settled');
              await refresh();
              Alert.alert('Success', 'Settlement recorded!');
            } catch (error) {
              Alert.alert('Error', 'Failed to record settlement');
            } finally {
              setSettling({ ...settling, [index]: false });
            }
          },
        },
      ]
    );
  };

  if (!selectedGroupId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No group selected</Text>
        <Text style={styles.emptySubtext}>Select a group from the Groups tab</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && balances.length === 0 ? (
        <View style={styles.centered}>
          <Text>Loading balances...</Text>
        </View>
      ) : balances.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No balances yet</Text>
          <Text style={styles.emptySubtext}>Add members and sessions to see balances</Text>
        </View>
      ) : (
        <FlatList
          data={balances}
          keyExtractor={(item) => item.memberId}
          contentContainerStyle={styles.list}
          ListHeaderComponent={() => (
            <View>
              <Text style={styles.sectionTitle}>Member Balances</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.balanceRow}>
                  <Text style={styles.memberName}>{item.memberName}</Text>
                  <Text
                    style={[
                      styles.balance,
                      item.totalCents > 0 && styles.positiveBalance,
                      item.totalCents < 0 && styles.negativeBalance,
                    ]}
                  >
                    {formatCentsWithSign(item.totalCents)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
          ListFooterComponent={
            settleUp.length > 0 ? (
              <View style={styles.settleUpSection}>
                <Text style={styles.sectionTitle}>Settle Up - Who Pays Whom?</Text>
                <Text style={styles.settleUpHint}>
                  These are the minimum transactions needed to settle all debts:
                </Text>
                {settleUp.map((transaction, index) => (
                  <Card key={index} style={styles.card}>
                    <Card.Content>
                      <View style={styles.settleUpRow}>
                        <View style={styles.settleUpInfo}>
                          <Text style={styles.settleUpText}>
                            {transaction.fromMemberName} pays {transaction.toMemberName}
                          </Text>
                          <Text style={styles.settleUpAmount}>
                            {formatCents(transaction.amountCents)}
                          </Text>
                        </View>
                        <Button
                          mode="contained"
                          compact
                          loading={settling[index]}
                          disabled={settling[index]}
                          onPress={() =>
                            handleMarkAsSettled(
                              transaction.fromMemberId,
                              transaction.toMemberId,
                              transaction.amountCents,
                              index
                            )
                          }
                          style={styles.settleButton}
                        >
                          Mark Paid
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ) : (
              <View style={styles.settledSection}>
                <Text style={styles.settledText}>✓ All debts settled!</Text>
              </View>
            )
          }
        />
      )}
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.card,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: darkColors.textPrimary,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
    color: darkColors.textPrimary,
  },
  positiveBalance: {
    color: darkColors.positive,
  },
  negativeBalance: {
    color: darkColors.negative,
  },
  settleUpSection: {
    marginTop: spacing.xl,
  },
  settleUpHint: {
    fontSize: 13,
    color: darkColors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  settleUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settleUpInfo: {
    flex: 1,
  },
  settleUpText: {
    fontSize: 14,
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  settleUpAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: darkColors.accent,
  },
  settleButton: {
    backgroundColor: darkColors.positive,
    marginLeft: spacing.md,
  },
  settledSection: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  settledText: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.positive,
  },
});
