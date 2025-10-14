import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCentsWithSign } from '@/utils/settleUp';

interface MemberTileProps {
  memberName: string;
  balanceCents: number;
  onPress?: () => void;
}

export default function MemberTile({ memberName, balanceCents, onPress }: MemberTileProps) {
  const getBalanceColor = () => {
    if (balanceCents > 0) return darkColors.positive;
    if (balanceCents < 0) return darkColors.negative;
    return darkColors.textMuted;
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.info}>
          <Text style={styles.name}>{memberName}</Text>
          <Text style={[styles.balance, { color: getBalanceColor() }]}>
            {formatCentsWithSign(balanceCents)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: darkColors.card,
    borderRadius: 12,
    marginBottom: spacing.md,
    elevation: 2,
  },
  content: {
    paddingVertical: spacing.md,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: darkColors.textPrimary,
  },
  balance: {
    fontSize: 18,
    fontWeight: '700',
  },
});

