import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, Button, TextInput, Text } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';

interface CashoutDialogProps {
  visible: boolean;
  memberName: string;
  currentCashout: number;
  isLoading: boolean;
  onDismiss: () => void;
  onSubmit: (amount: number) => Promise<void>;
}

export function CashoutDialog({
  visible,
  memberName,
  currentCashout,
  isLoading,
  onDismiss,
  onSubmit,
}: CashoutDialogProps) {
  const [cashoutAmount, setCashoutAmount] = useState('');

  // Update amount when dialog opens
  useEffect(() => {
    if (visible) {
      setCashoutAmount(
        currentCashout > 0 ? (currentCashout / 100).toString() : ''
      );
    }
  }, [visible, currentCashout]);

  const handleSubmit = async () => {
    const amount = parseFloat(cashoutAmount);
    if (isNaN(amount) || amount < 0) {
      return;
    }
    await onSubmit(amount);
    setCashoutAmount('');
  };

  const handleDismiss = () => {
    setCashoutAmount('');
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss}>
        <Dialog.Title>Set Cashout</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogText}>
            Cashout amount for: {memberName}
          </Text>
          <TextInput
            label="Cashout Amount"
            value={cashoutAmount}
            onChangeText={setCashoutAmount}
            mode="outlined"
            placeholder="250"
            keyboardType="numeric"
            left={<TextInput.Affix text="$" />}
            autoFocus
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} disabled={isLoading}>
            Cancel
          </Button>
          <Button onPress={handleSubmit} loading={isLoading} disabled={isLoading}>
            Save
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
});

export default CashoutDialog;
