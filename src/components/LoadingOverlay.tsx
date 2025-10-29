import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Full-screen loading overlay
 * Use for operations that block the entire UI
 */
export function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={darkColors.accent} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
    minWidth: 150,
  },
  message: {
    marginTop: spacing.md,
    color: darkColors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
