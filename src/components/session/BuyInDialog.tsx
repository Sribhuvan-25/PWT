import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';

interface BuyInDialogProps {
  visible: boolean;
  memberName: string;
  isLoading: boolean;
  onDismiss: () => void;
  onSubmit: (amount: number) => Promise<void>;
}

export function BuyInDialog({
  visible,
  memberName,
  isLoading,
  onDismiss,
  onSubmit,
}: BuyInDialogProps) {
  const [buyInAmount, setBuyInAmount] = useState('');

  const handleSubmit = async () => {
    const amount = parseFloat(buyInAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }
    await onSubmit(amount);
    setBuyInAmount('');
  };

  const handleDismiss = () => {
    setBuyInAmount('');
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>Add Buy-in</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogText}>Adding buy-in for: {memberName}</Text>

          {/* Preset Amount Buttons */}
          <Text style={styles.presetLabel}>Quick amounts:</Text>
          <View style={styles.presetButtonsContainer}>
            <Button
              mode="outlined"
              onPress={() => setBuyInAmount('50')}
              style={[
                styles.presetButton,
                buyInAmount === '50' && styles.presetButtonSelected,
              ]}
              compact
            >
              $50
            </Button>
            <Button
              mode="outlined"
              onPress={() => setBuyInAmount('100')}
              style={[
                styles.presetButton,
                buyInAmount === '100' && styles.presetButtonSelected,
              ]}
              compact
            >
              $100
            </Button>
            <Button
              mode="outlined"
              onPress={() => setBuyInAmount('200')}
              style={[
                styles.presetButton,
                buyInAmount === '200' && styles.presetButtonSelected,
              ]}
              compact
            >
              $200
            </Button>
          </View>

          {/* Custom Amount Input */}
          <TextInput
            label="Custom Amount"
            value={buyInAmount}
            onChangeText={setBuyInAmount}
            mode="outlined"
            placeholder="Enter custom amount"
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
            style={styles.customAmountInput}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} disabled={isLoading}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} loading={isLoading} disabled={isLoading}>
            Add
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialogText: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.md,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  presetButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  presetButton: {
    flex: 1,
    borderColor: darkColors.border,
  },
  presetButtonSelected: {
    borderColor: darkColors.accent,
    borderWidth: 2,
    backgroundColor: darkColors.accent + '20',
  },
  customAmountInput: {
    marginTop: spacing.xs,
  },
});

export default BuyInDialog;
