import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';

interface ManualAdjustmentDialogProps {
  visible: boolean;
  isLoading: boolean;
  onDismiss: () => void;
  onSubmit: (amountDollars: string, note: string) => Promise<void>;
}

export function ManualAdjustmentDialog({
  visible,
  isLoading,
  onDismiss,
  onSubmit,
}: ManualAdjustmentDialogProps) {
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNote, setAdjustmentNote] = useState('');

  const handleSubmit = async () => {
    await onSubmit(adjustmentAmount, adjustmentNote);
    setAdjustmentAmount('');
    setAdjustmentNote('');
  };

  const handleDismiss = () => {
    setAdjustmentAmount('');
    setAdjustmentNote('');
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleDismiss}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Manual Adjustment</Text>
            <Text style={styles.modalDescription}>
              Add or subtract from your total P/L. Use negative amounts for losses.
            </Text>

            <TextInput
              label="Amount (e.g., -50 or 100)"
              value={adjustmentAmount}
              onChangeText={setAdjustmentAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              placeholder="0.00"
              outlineColor={darkColors.border}
              activeOutlineColor={darkColors.accent}
              textColor={darkColors.textPrimary}
            />

            <TextInput
              label="Note (optional)"
              value={adjustmentNote}
              onChangeText={setAdjustmentNote}
              mode="outlined"
              style={styles.input}
              placeholder="Reason for adjustment"
              outlineColor={darkColors.border}
              activeOutlineColor={darkColors.accent}
              textColor={darkColors.textPrimary}
            />

            <View style={styles.modalButtons}>
              <Button
                onPress={handleDismiss}
                disabled={isLoading}
                textColor={darkColors.textMuted}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading || !adjustmentAmount}
                mode="contained"
                buttonColor={darkColors.accent}
                style={styles.modalButton}
              >
                Add
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
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
  modalContent: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    padding: spacing.xl,
    width: 340,
    maxWidth: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  modalButton: {
    minWidth: 80,
  },
});

export default ManualAdjustmentDialog;
