import React from 'react';
import { Portal, Dialog, Button, Text } from 'react-native-paper';
import { darkColors } from '@/utils/theme';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = darkColors.accent,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            textColor={confirmColor}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

