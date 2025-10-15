import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCentsWithSign, formatCents } from '@/utils/settleUp';

export default function StatsScreen() {
  const { stats, loading, refresh } = usePlayerStats();

  const getResultColor = (netCents: number) => {
    if (netCents > 0) return darkColors.positive;
    if (netCents < 0) return darkColors.negative;
    return darkColors.textMuted;
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

      {/* Session History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game History</Text>
      </View>

      {loading && stats.sessionHistory.length === 0 ? (
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
              refreshing={loading}
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
});

