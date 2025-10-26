import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { darkColors, spacing } from '@/utils/theme';
import { SessionHistory } from '@/hooks/usePlayerStats';
import { formatCents } from '@/utils/settleUp';

interface CashFlowChartProps {
  sessionHistory: SessionHistory[];
  totalAdjustmentsCents: number;
}

type ChartMode = 'cumulative' | 'session';

export default function CashFlowChart({ sessionHistory, totalAdjustmentsCents }: CashFlowChartProps) {
  const [mode, setMode] = React.useState<ChartMode>('cumulative');
  const screenWidth = Dimensions.get('window').width;

  // Process data for charts
  const chartData = useMemo(() => {
    if (sessionHistory.length === 0) {
      return null;
    }

    // Sort by date ascending (oldest first) for proper cumulative calculation
    const sortedHistory = [...sessionHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Limit to last 10 sessions for better visibility
    const recentSessions = sortedHistory.slice(-10);

    // Calculate cumulative values
    let cumulative = 0;
    const cumulativeData = recentSessions.map((session) => {
      cumulative += session.netCents;
      return cumulative / 100; // Convert to dollars
    });

    // Individual session values in dollars
    const sessionData = recentSessions.map((session) => session.netCents / 100);

    // Create labels (dates)
    const labels = recentSessions.map((session) => {
      const date = new Date(session.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    return {
      labels,
      cumulativeData,
      sessionData,
      sessionNames: recentSessions.map((s) => s.groupName),
    };
  }, [sessionHistory]);

  if (!chartData) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.emptyText}>No session data to display</Text>
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
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: darkColors.accent,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: darkColors.border,
      strokeWidth: 1,
    },
  };

  const barChartConfig = {
    ...chartConfig,
    color: (opacity = 1) => {
      // Color based on positive/negative
      return `rgba(124, 92, 255, ${opacity})`;
    },
  };

  // Calculate if we have any negative values for proper y-axis range
  const hasNegative = mode === 'cumulative'
    ? chartData.cumulativeData.some(v => v < 0)
    : chartData.sessionData.some(v => v < 0);

  const minValue = mode === 'cumulative'
    ? Math.min(...chartData.cumulativeData, 0)
    : Math.min(...chartData.sessionData, 0);

  const maxValue = mode === 'cumulative'
    ? Math.max(...chartData.cumulativeData, 0)
    : Math.max(...chartData.sessionData, 0);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cash Flow Analysis</Text>
            <Text style={styles.subtitle}>
              {sessionHistory.length > 10 ? 'Last 10 sessions' : `${sessionHistory.length} sessions`}
            </Text>
          </View>
        </View>

        <SegmentedButtons
          value={mode}
          onValueChange={(value) => setMode(value as ChartMode)}
          buttons={[
            {
              value: 'cumulative',
              label: 'Cumulative',
              style: mode === 'cumulative' ? styles.segmentSelected : styles.segment,
            },
            {
              value: 'session',
              label: 'Per Session',
              style: mode === 'session' ? styles.segmentSelected : styles.segment,
            },
          ]}
          style={styles.segmentButtons}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            {mode === 'cumulative' ? (
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.cumulativeData,
                      color: (opacity = 1) => `rgba(124, 92, 255, ${opacity})`,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={Math.max(screenWidth - 60, chartData.labels.length * 60)}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                fromZero={!hasNegative}
                segments={4}
                withInnerLines={true}
                withOuterLines={true}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                yAxisSuffix=""
                yAxisLabel="$"
              />
            ) : (
              <BarChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.sessionData,
                      colors: chartData.sessionData.map((value) =>
                        value >= 0
                          ? (opacity = 1) => `rgba(34, 197, 94, ${opacity})` // positive
                          : (opacity = 1) => `rgba(239, 68, 68, ${opacity})` // negative
                      ),
                    },
                  ],
                }}
                width={Math.max(screenWidth - 60, chartData.labels.length * 60)}
                height={220}
                chartConfig={barChartConfig}
                style={styles.chart}
                fromZero={!hasNegative}
                segments={4}
                withInnerLines={true}
                showValuesOnTopOfBars={false}
                yAxisSuffix=""
                yAxisLabel="$"
              />
            )}
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legend}>
          {mode === 'cumulative' ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: darkColors.accent }]} />
              <Text style={styles.legendText}>Total P/L over time</Text>
            </View>
          ) : (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkColors.positive }]} />
                <Text style={styles.legendText}>Wins</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: darkColors.negative }]} />
                <Text style={styles.legendText}>Losses</Text>
              </View>
            </>
          )}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Sessions</Text>
            <Text style={styles.statValue}>{sessionHistory.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>
              {sessionHistory.length > 0
                ? `${Math.round((sessionHistory.filter(s => s.netCents > 0).length / sessionHistory.length) * 100)}%`
                : '0%'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Session</Text>
            <Text style={styles.statValue}>
              {sessionHistory.length > 0
                ? formatCents(Math.round(sessionHistory.reduce((sum, s) => sum + s.netCents, 0) / sessionHistory.length))
                : '$0.00'}
            </Text>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: darkColors.textMuted,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: darkColors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: darkColors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: darkColors.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: darkColors.border,
  },
  emptyText: {
    fontSize: 14,
    color: darkColors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
