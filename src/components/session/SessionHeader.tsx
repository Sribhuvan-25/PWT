import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';

interface SessionHeaderProps {
  sessionName: string;
  sessionDate: string;
  joinCode: string;
  sessionNote?: string;
  sessionStatus: 'active' | 'completed';
}

export function SessionHeader({
  sessionName,
  sessionDate,
  joinCode,
  sessionNote,
  sessionStatus,
}: SessionHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.sessionName}>{sessionName}</Text>
      <Text style={styles.sessionDate}>{formatDate(sessionDate)}</Text>
      <Text style={styles.joinCode}>Join Code: {joinCode}</Text>
      {sessionNote && <Text style={styles.sessionNote}>{sessionNote}</Text>}
      <Text style={styles.sessionStatus}>
        Status: {sessionStatus === 'completed' ? 'Completed' : 'Active'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.lg,
    backgroundColor: darkColors.card,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  sessionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  sessionDate: {
    fontSize: 16,
    color: darkColors.textSecondary,
    marginBottom: spacing.xs,
  },
  joinCode: {
    fontSize: 14,
    color: darkColors.textMuted,
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
  },
  sessionNote: {
    fontSize: 14,
    color: darkColors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sessionStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: darkColors.accent,
    marginTop: spacing.xs,
  },
});

export default SessionHeader;
