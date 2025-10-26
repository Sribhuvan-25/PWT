import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { darkColors, spacing } from '@/utils/theme';
import { SessionHistory } from '@/hooks/usePlayerStats';
import { formatCents, formatCentsWithSign } from '@/utils/settleUp';

interface ProfitLossGraphProps {
  sessionHistory: SessionHistory[];
}

type TimeRange = 'monthly' | 'quarterly' | 'all';

interface AggregatedData {
  labels: string[];
  values: number[];
  periods: string[];
}

interface StatsData {
  biggestWin: number;
  biggestLoss: number;
  bestMonth: string | null;
  worstMonth: string | null;
  winStreak: number;
  lossStreak: number;
}

export default function ProfitLossGraph({ sessionHistory }: ProfitLossGraphProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('monthly');
  const screenWidth = Dimensions.get('window').width;

  // Aggregate data by time period
  const aggregatedData = useMemo((): AggregatedData | null => {
    if (sessionHistory.length === 0) return null;

    const sorted = [...sessionHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (timeRange === 'all') {
      // Show each session
      const recentSessions = sorted.slice(-10);
      return {
        labels: recentSessions.map((s, i) => `S${i + 1}`),
        values: recentSessions.map(s => s.netCents / 100),
        periods: recentSessions.map(s => {
          const date = new Date(s.date);
          return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        }),
      };
    }

    // Group by month or quarter
    const groupedData = new Map<string, { netCents: number; label: string }>();

    sorted.forEach((session) => {
      const date = new Date(session.date);
      const year = date.getFullYear();
      const month = date.getMonth();

      let key: string;
      let label: string;

      if (timeRange === 'monthly') {
        key = `${year}-${month}`;
        label = new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        // quarterly
        const quarter = Math.floor(month / 3) + 1;
        key = `${year}-Q${quarter}`;
        label = `Q${quarter} '${year.toString().slice(2)}`;
      }

      const existing = groupedData.get(key);
      if (existing) {
        existing.netCents += session.netCents;
      } else {
        groupedData.set(key, { netCents: session.netCents, label });
      }
    });

    const entries = Array.from(groupedData.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12); // Last 12 periods

    return {
      labels: entries.map(([_, data]) => data.label),
      values: entries.map(([_, data]) => data.netCents / 100),
      periods: entries.map(([_, data]) => data.label),
    };
  }, [sessionHistory, timeRange]);

  // Calculate statistics
  const stats = useMemo((): StatsData => {
    if (sessionHistory.length === 0) {
      return {
        biggestWin: 0,
        biggestLoss: 0,
        bestMonth: null,
        worstMonth: null,
        winStreak: 0,
        lossStreak: 0,
      };
    }

    const sorted = [...sessionHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Biggest win/loss
    const biggestWin = Math.max(...sessionHistory.map(s => s.netCents));
    const biggestLoss = Math.min(...sessionHistory.map(s => s.netCents));

    // Group by month for best/worst month
    const monthlyData = new Map<string, number>();
    sessionHistory.forEach((session) => {
      const date = new Date(session.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData.set(key, (monthlyData.get(key) || 0) + session.netCents);
    });

    let bestMonth: string | null = null;
    let worstMonth: string | null = null;
    let bestMonthValue = -Infinity;
    let worstMonthValue = Infinity;

    monthlyData.forEach((value, key) => {
      const date = new Date(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]));
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (value > bestMonthValue) {
        bestMonthValue = value;
        bestMonth = label;
      }
      if (value < worstMonthValue) {
        worstMonthValue = value;
        worstMonth = label;
      }
    });

    // Calculate win/loss streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let isWinStreak = sorted[0]?.netCents > 0;

    sorted.forEach((session) => {
      if (session.netCents > 0) {
        if (isWinStreak) {
          currentStreak++;
        } else {
          maxLossStreak = Math.max(maxLossStreak, currentStreak);
          currentStreak = 1;
          isWinStreak = true;
        }
      } else if (session.netCents < 0) {
        if (!isWinStreak) {
          currentStreak++;
        } else {
          maxWinStreak = Math.max(maxWinStreak, currentStreak);
          currentStreak = 1;
          isWinStreak = false;
        }
      }
    });

    // Update final streak
    if (isWinStreak) {
      maxWinStreak = Math.max(maxWinStreak, currentStreak);
    } else {
      maxLossStreak = Math.max(maxLossStreak, currentStreak);
    }

    return {
      biggestWin,
      biggestLoss,
      bestMonth,
      worstMonth,
      winStreak: maxWinStreak,
      lossStreak: maxLossStreak,
    };
  }, [sessionHistory]);

  if (!aggregatedData) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.emptyText}>No profit/loss data to display</Text>
        </Card.Content>
      </Card>
    );
  }

  const chartConfig = {
    backgroundColor: darkColors.card,
    backgroundGradientFrom: darkColors.card,
    backgroundGradientTo: darkColors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(124, 92, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(154, 163, 175, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: darkColors.border,
      strokeWidth: 1,
    },
  };

  const hasNegative = aggregatedData.values.some(v => v < 0);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Profit/Loss Trends</Text>
            <Text style={styles.subtitle}>
              {timeRange === 'monthly' ? 'Monthly' : timeRange === 'quarterly' ? 'Quarterly' : 'Recent Sessions'}
            </Text>
          </View>
        </View>

        <SegmentedButtons
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          buttons={[
            {
              value: 'monthly',
              label: 'Monthly',
              style: timeRange === 'monthly' ? styles.segmentSelected : styles.segment,
            },
            {
              value: 'quarterly',
              label: 'Quarterly',
              style: timeRange === 'quarterly' ? styles.segmentSelected : styles.segment,
            },
            {
              value: 'all',
              label: 'Sessions',
              style: timeRange === 'all' ? styles.segmentSelected : styles.segment,
            },
          ]}
          style={styles.segmentButtons}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: aggregatedData.labels,
                datasets: [
                  {
                    data: aggregatedData.values,
                    colors: aggregatedData.values.map((value) =>
                      value >= 0
                        ? (opacity = 1) => `rgba(34, 197, 94, ${opacity})`
                        : (opacity = 1) => `rgba(239, 68, 68, ${opacity})`
                    ),
                  },
                ],
              }}
              width={Math.max(screenWidth - 60, aggregatedData.labels.length * 60)}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero={!hasNegative}
              segments={4}
              withInnerLines={true}
              showValuesOnTopOfBars={false}
              yAxisSuffix=""
              yAxisLabel="$"
            />
          </View>
        </ScrollView>

        {/* Performance Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Performance Highlights</Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Biggest Win</Text>
              <Text style={[styles.statValue, { color: darkColors.positive }]}>
                {formatCentsWithSign(stats.biggestWin)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Biggest Loss</Text>
              <Text style={[styles.statValue, { color: darkColors.negative }]}>
                {formatCentsWithSign(stats.biggestLoss)}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Best Month</Text>
              <Text style={styles.statValue}>
                {stats.bestMonth || 'N/A'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Worst Month</Text>
              <Text style={styles.statValue}>
                {stats.worstMonth || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Win Streak</Text>
              <Text style={[styles.statValue, { color: darkColors.positive }]}>
                {stats.winStreak} {stats.winStreak === 1 ? 'session' : 'sessions'}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Loss Streak</Text>
              <Text style={[styles.statValue, { color: darkColors.negative }]}>
                {stats.lossStreak} {stats.lossStreak === 1 ? 'session' : 'sessions'}
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg,
    marginTop: 0,
    backgroundColor: darkColors.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: darkColors.textMuted,
  },
  segmentButtons: {
    marginBottom: spacing.lg,
  },
  segment: {
    borderColor: darkColors.border,
  },
  segmentSelected: {
    backgroundColor: darkColors.accent,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  statsSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: darkColors.background,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: darkColors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: darkColors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
