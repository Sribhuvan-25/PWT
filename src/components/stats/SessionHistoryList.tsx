import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import { formatCentsWithSign } from '@/utils/settleUp';

export interface SessionHistoryItem {
  sessionId: string;
  groupName: string;
  date: string;
  note?: string | null;
  netCents: number;
}

interface SessionHistoryListProps {
  sessionHistory: SessionHistoryItem[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

export function SessionHistoryList({
  sessionHistory,
  loading,
  refreshing,
  onRefresh,
}: SessionHistoryListProps) {
  const getResultColor = (netCents: number) => {
    if (netCents > 0) return darkColors.positive;
    if (netCents < 0) return darkColors.negative;
    return darkColors.textMuted;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Loading stats...</Text>
      </View>
    );
  }

  if (sessionHistory.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No game history yet</Text>
        <Text style={styles.emptySubtext}>
          Join groups and play sessions to see your stats!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={sessionHistory}
      keyExtractor={(item) => `${item.sessionId}-${item.date}`}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
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
                {item.note && <Text style={styles.note}>{item.note}</Text>}
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
  );
}

const styles = StyleSheet.create({
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

export default SessionHistoryList;
