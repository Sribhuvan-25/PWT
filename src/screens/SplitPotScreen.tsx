import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Divider,
  IconButton,
  Chip,
} from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { formatCents, parseDollarsToCents } from '@/utils/settleUp';

interface Player {
  id: string;
  name: string;
  contribution: number; // in cents
}

interface PotSplit {
  potName: string;
  totalPot: number; // in cents
  players: string[]; // player IDs eligible for this pot
  amountPerPlayer: number; // in cents
}

export default function SplitPotScreen() {
  const [mainPot, setMainPot] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'Player 1', contribution: 0 },
    { id: '2', name: 'Player 2', contribution: 0 },
  ]);
  const [potSplits, setPotSplits] = useState<PotSplit[]>([]);
  const [calculationMode, setCalculationMode] = useState<'simple' | 'sidepot'>('simple');

  // Calculate pot splits
  const calculateSplits = () => {
    if (calculationMode === 'simple') {
      calculateSimpleSplit();
    } else {
      calculateSidePots();
    }
  };

  // Simple equal split among all players
  const calculateSimpleSplit = () => {
    const totalPotCents = parseDollarsToCents(mainPot);

    if (totalPotCents <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid pot amount');
      return;
    }

    const numPlayers = players.length;
    const amountPerPlayer = Math.floor(totalPotCents / numPlayers);
    const remainder = totalPotCents % numPlayers;

    const split: PotSplit = {
      potName: 'Main Pot',
      totalPot: totalPotCents,
      players: players.map(p => p.name),
      amountPerPlayer,
    };

    setPotSplits([split]);
  };

  // Calculate side pots based on contributions (all-in scenarios)
  const calculateSidePots = () => {
    // Validate inputs
    const playersWithContributions = players.map(p => ({
      ...p,
      contribution: p.contribution || 0,
    }));

    const totalContributions = playersWithContributions.reduce((sum, p) => sum + p.contribution, 0);

    if (totalContributions <= 0) {
      Alert.alert('Invalid Input', 'Please enter contribution amounts for each player');
      return;
    }

    // Sort players by contribution (lowest to highest)
    const sortedPlayers = [...playersWithContributions].sort((a, b) => a.contribution - b.contribution);

    const splits: PotSplit[] = [];
    let remainingPlayers = [...sortedPlayers];
    let previousContribution = 0;

    // Calculate each pot
    while (remainingPlayers.length > 0) {
      const lowestContribution = remainingPlayers[0].contribution;
      const potContribution = lowestContribution - previousContribution;

      if (potContribution > 0) {
        const potTotal = potContribution * remainingPlayers.length;
        const amountPerPlayer = Math.floor(potTotal / remainingPlayers.length);

        splits.push({
          potName: splits.length === 0 ? 'Main Pot' : `Side Pot ${splits.length}`,
          totalPot: potTotal,
          players: remainingPlayers.map(p => p.name),
          amountPerPlayer,
        });
      }

      previousContribution = lowestContribution;
      remainingPlayers.shift(); // Remove player with lowest contribution
    }

    setPotSplits(splits);
  };

  // Add a new player
  const addPlayer = () => {
    const newId = (players.length + 1).toString();
    setPlayers([...players, { id: newId, name: `Player ${newId}`, contribution: 0 }]);
  };

  // Remove a player
  const removePlayer = (id: string) => {
    if (players.length <= 2) {
      Alert.alert('Minimum Players', 'You need at least 2 players');
      return;
    }
    setPlayers(players.filter(p => p.id !== id));
  };

  // Update player name
  const updatePlayerName = (id: string, name: string) => {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p));
  };

  // Update player contribution
  const updatePlayerContribution = (id: string, amount: string) => {
    const cents = parseDollarsToCents(amount);
    setPlayers(players.map(p => p.id === id ? { ...p, contribution: cents } : p));
  };

  // Clear all
  const clearAll = () => {
    setMainPot('');
    setPlayers([
      { id: '1', name: 'Player 1', contribution: 0 },
      { id: '2', name: 'Player 2', contribution: 0 },
    ]);
    setPotSplits([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Mode Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Calculation Mode</Text>
            <View style={styles.modeContainer}>
              <Chip
                selected={calculationMode === 'simple'}
                onPress={() => {
                  setCalculationMode('simple');
                  setPotSplits([]);
                }}
                style={styles.chip}
                textStyle={styles.chipText}
              >
                Simple Split
              </Chip>
              <Chip
                selected={calculationMode === 'sidepot'}
                onPress={() => {
                  setCalculationMode('sidepot');
                  setPotSplits([]);
                }}
                style={styles.chip}
                textStyle={styles.chipText}
              >
                Side Pots
              </Chip>
            </View>
            <Text style={styles.helpText}>
              {calculationMode === 'simple'
                ? 'Split pot equally among all players'
                : 'Calculate side pots for all-in scenarios'}
            </Text>
          </Card.Content>
        </Card>

        {/* Simple Split Mode */}
        {calculationMode === 'simple' && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Total Pot Amount</Text>
              <TextInput
                label="Pot Amount ($)"
                value={mainPot}
                onChangeText={setMainPot}
                keyboardType="decimal-pad"
                mode="outlined"
                style={styles.input}
                theme={{ colors: { primary: darkColors.accent } }}
              />
            </Card.Content>
          </Card>
        )}

        {/* Players Section */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Players ({players.length})</Text>
              <Button
                mode="outlined"
                onPress={addPlayer}
                compact
                icon="plus"
                textColor={darkColors.accent}
              >
                Add
              </Button>
            </View>

            {players.map((player, index) => (
              <View key={player.id} style={styles.playerRow}>
                <View style={styles.playerInputs}>
                  <TextInput
                    label="Name"
                    value={player.name}
                    onChangeText={(text) => updatePlayerName(player.id, text)}
                    mode="outlined"
                    style={[styles.input, styles.playerNameInput]}
                    theme={{ colors: { primary: darkColors.accent } }}
                  />

                  {calculationMode === 'sidepot' && (
                    <TextInput
                      label="Contribution ($)"
                      value={player.contribution > 0 ? formatCents(player.contribution) : ''}
                      onChangeText={(text) => updatePlayerContribution(player.id, text)}
                      keyboardType="decimal-pad"
                      mode="outlined"
                      style={[styles.input, styles.contributionInput]}
                      theme={{ colors: { primary: darkColors.accent } }}
                    />
                  )}
                </View>

                <IconButton
                  icon="close"
                  size={20}
                  iconColor={darkColors.negative}
                  onPress={() => removePlayer(player.id)}
                />
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Calculate Button */}
        <Button
          mode="contained"
          onPress={calculateSplits}
          style={styles.calculateButton}
          contentStyle={styles.buttonContent}
          buttonColor={darkColors.accent}
        >
          Calculate Split
        </Button>

        {/* Results */}
        {potSplits.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Results</Text>

              {potSplits.map((split, index) => (
                <View key={index} style={styles.splitResult}>
                  <Text style={styles.potName}>{split.potName}</Text>
                  <Text style={styles.potTotal}>
                    Total: {formatCents(split.totalPot)}
                  </Text>
                  <Divider style={styles.divider} />

                  <Text style={styles.splitLabel}>Split Among:</Text>
                  {split.players.map((playerName, i) => (
                    <View key={i} style={styles.playerSplitRow}>
                      <Text style={styles.playerSplitName}>{playerName}</Text>
                      <Text style={styles.playerSplitAmount}>
                        {formatCents(split.amountPerPlayer)}
                      </Text>
                    </View>
                  ))}

                  {index < potSplits.length - 1 && (
                    <Divider style={styles.potDivider} />
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Clear Button */}
        {(mainPot || players.some(p => p.contribution > 0) || potSplits.length > 0) && (
          <Button
            mode="text"
            onPress={clearAll}
            style={styles.clearButton}
            textColor={darkColors.textMuted}
          >
            Clear All
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: darkColors.surface,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
  },
  modeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    flex: 1,
  },
  chipText: {
    fontSize: 13,
  },
  helpText: {
    fontSize: 13,
    color: darkColors.textMuted,
    marginTop: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  playerInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  playerNameInput: {
    flex: 2,
  },
  contributionInput: {
    flex: 1,
  },
  calculateButton: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  splitResult: {
    marginBottom: spacing.md,
  },
  potName: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.accent,
    marginBottom: spacing.xs,
  },
  potTotal: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginBottom: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
    backgroundColor: darkColors.border,
  },
  splitLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  playerSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: darkColors.background,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  playerSplitName: {
    fontSize: 14,
    color: darkColors.textPrimary,
  },
  playerSplitAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: darkColors.positive,
  },
  potDivider: {
    marginVertical: spacing.md,
    backgroundColor: darkColors.border,
    height: 2,
  },
  clearButton: {
    marginBottom: spacing.xl,
  },
});
