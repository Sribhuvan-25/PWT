import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, DataTable } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCents, formatCentsWithSign } from '@/utils/formatters';

export interface MemberSessionData {
  memberId: string;
  memberName: string;
  totalBuyIns: number;
  cashout: number;
  netResult: number;
}

interface MemberDataTableProps {
  memberData: MemberSessionData[];
  sessionStatus: 'active' | 'completed';
  canEditMember: (memberId: string) => boolean;
  onOpenBuyInDialog: (memberId: string) => void;
  onOpenCashoutDialog: (memberId: string, currentCashout: number) => void;
}

export function MemberDataTable({
  memberData,
  sessionStatus,
  canEditMember,
  onOpenBuyInDialog,
  onOpenCashoutDialog,
}: MemberDataTableProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Session Details</Text>

      {memberData.length === 0 ? (
        <Text style={styles.emptyText}>No participants data yet</Text>
      ) : (
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Player</DataTable.Title>
            <DataTable.Title numeric>Buy-ins</DataTable.Title>
            <DataTable.Title numeric>Cashout</DataTable.Title>
            <DataTable.Title numeric>Net</DataTable.Title>
          </DataTable.Header>

          {memberData.map((data) => {
            const canEdit = canEditMember(data.memberId);
            return (
              <DataTable.Row key={data.memberId}>
                <DataTable.Cell>{data.memberName}</DataTable.Cell>
                <DataTable.Cell numeric>
                  <Button
                    mode="text"
                    compact
                    onPress={() => onOpenBuyInDialog(data.memberId)}
                    textColor={canEdit ? darkColors.accent : darkColors.textMuted}
                    disabled={!canEdit}
                  >
                    {formatCents(data.totalBuyIns)}
                  </Button>
                </DataTable.Cell>
                <DataTable.Cell numeric>
                  <Button
                    mode="text"
                    compact
                    onPress={() => onOpenCashoutDialog(data.memberId, data.cashout)}
                    textColor={canEdit ? darkColors.accent : darkColors.textMuted}
                    disabled={!canEdit}
                  >
                    {formatCents(data.cashout)}
                  </Button>
                </DataTable.Cell>
                <DataTable.Cell
                  numeric
                  textStyle={{
                    color:
                      data.cashout === 0
                        ? darkColors.textMuted
                        : data.netResult > 0
                        ? darkColors.positive
                        : data.netResult < 0
                        ? darkColors.negative
                        : darkColors.textMuted,
                    fontWeight: data.cashout === 0 ? '400' : '700',
                  }}
                >
                  {data.cashout === 0 ? '—' : formatCentsWithSign(data.netResult)}
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      )}

      <Text style={styles.hint}>
        {sessionStatus === 'completed'
          ? 'Session is completed. No edits allowed.'
          : 'Tap on Buy-ins or Cashout to update values (only your own row)'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: darkColors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  hint: {
    fontSize: 13,
    color: darkColors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});

export default MemberDataTable;
