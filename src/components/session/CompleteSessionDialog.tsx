import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCents } from '@/utils/formatters';

export interface SettlementItem {
  fromMemberName: string;
  toMemberName: string;
  amountCents: number;
}

interface CompleteSessionDialogProps {
  visible: boolean;
  settlements: SettlementItem[];
  isLoading: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export function CompleteSessionDialog({
  visible,
  settlements,
  isLoading,
  onDismiss,
  onConfirm,
}: CompleteSessionDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.settlementContainer}>
              <Text style={styles.settlementDialogTitle}>Complete Session</Text>

              {settlements.length === 0 ? (
                <Text style={styles.settlementText}>All players are even!</Text>
              ) : (
                <ScrollView
                  style={styles.settlementScrollView}
                  contentContainerStyle={styles.settlementScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {settlements.map((settlement, index) => (
                    <View key={index} style={styles.settlementItem}>
                      <View style={styles.settlementRow}>
                        <Text style={styles.settlementFrom}>
                          {settlement.fromMemberName}
                        </Text>
                        <Text style={styles.settlementArrow}>→</Text>
                        <Text style={styles.settlementTo}>
                          {settlement.toMemberName}
                        </Text>
                      </View>
                      <Text style={styles.settlementAmount}>
                        {formatCents(settlement.amountCents)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.settlementNote}>
                Players can still view details but no new transactions can be added.
              </Text>

              <View style={styles.settlementButtonContainer}>
                <Button
                  onPress={onDismiss}
                  disabled={isLoading}
                  textColor={darkColors.textMuted}
                  style={styles.settlementCancelButton}
                >
                  Cancel
                </Button>
                <Button
                  onPress={onConfirm}
                  loading={isLoading}
                  disabled={isLoading}
                  mode="contained"
                  buttonColor={darkColors.positive}
                  style={styles.settlementConfirmButton}
                >
                  Mark as Completed
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settlementContainer: {
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  settlementDialogTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: darkColors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  settlementText: {
    fontSize: 16,
    color: darkColors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  settlementScrollView: {
    maxHeight: 300,
  },
  settlementScrollContent: {
    paddingVertical: spacing.sm,
  },
  settlementItem: {
    backgroundColor: darkColors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  settlementFrom: {
    fontSize: 15,
    fontWeight: '600',
    color: darkColors.negative,
    flex: 1,
  },
  settlementArrow: {
    fontSize: 16,
    color: darkColors.textMuted,
    marginHorizontal: spacing.sm,
  },
  settlementTo: {
    fontSize: 15,
    fontWeight: '600',
    color: darkColors.positive,
    flex: 1,
    textAlign: 'right',
  },
  settlementAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: darkColors.accent,
    textAlign: 'center',
  },
  settlementNote: {
    fontSize: 13,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  settlementButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  settlementCancelButton: {
    flex: 1,
  },
  settlementConfirmButton: {
    flex: 1,
  },
});

export default CompleteSessionDialog;
