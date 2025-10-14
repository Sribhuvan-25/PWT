import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Button, TextInput, Portal, Dialog } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSessions } from '@/hooks/useSessions';
import { useAppStore } from '@/stores/appStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';

type RootStackParamList = {
  SessionsList: undefined;
  SessionDetails: { sessionId: string };
};

type SessionsNavigationProp = StackNavigationProp<RootStackParamList>;

export default function SessionsScreen() {
  const navigation = useNavigation<SessionsNavigationProp>();
  const { sessions, loading, createSession, joinSession, refresh } = useSessions();
  const { selectedSessionId, setSelectedSession } = useAppStore();
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    try {
      // Use current date automatically
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const newSession = await createSession(sessionName.trim(), currentDate);
      setSessionName('');
      setCreateDialogVisible(false);
      setSelectedSession(newSession.id);
      Alert.alert('Success', `Session "${newSession.name}" created!\nJoin code: ${newSession.joinCode}`);
      // Navigate to session details
      navigation.navigate('SessionDetails', { sessionId: newSession.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create session');
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) return;

    try {
      const session = await joinSession(joinCode.trim());
      setJoinCode('');
      setJoinDialogVisible(false);
      setSelectedSession(session.id);
      Alert.alert('Success', `Joined "${session.name}"!`);
      navigation.navigate('SessionDetails', { sessionId: session.id });
    } catch (error) {
      console.error('Join session error:', error);
      Alert.alert('Error', 'Failed to join session');
    }
  };

  const handleSessionPress = (sessionId: string) => {
    setSelectedSession(sessionId);
    navigation.navigate('SessionDetails', { sessionId });
  };

  return (
    <View style={styles.container}>
      {loading && sessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Loading sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySubtext}>Create or join a poker session!</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={[
                styles.card,
                item.id === selectedSessionId && styles.selectedCard,
              ]}
              onPress={() => handleSessionPress(item.id)}
            >
              <Card.Content>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{item.name}</Text>
                  <Text style={styles.joinCode}>Join code: {item.joinCode}</Text>
                  <Text style={styles.date}>{formatDate(item.date)}</Text>
                  {item.note && <Text style={styles.note}>{item.note}</Text>}
                  <Text style={[styles.status, item.status === 'completed' && styles.statusCompleted]}>
                    {item.status === 'completed' ? 'Completed' : 'Active'}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}

      <View style={styles.fabContainer}>
        <FAB
          icon="account-plus"
          style={[styles.fab, styles.fabJoin]}
          onPress={() => setJoinDialogVisible(true)}
          label="Join"
        />
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setCreateDialogVisible(true)}
        />
      </View>

      <Portal>
        {/* Create Session Dialog */}
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New Session</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Session Name"
              value={sessionName}
              onChangeText={setSessionName}
              mode="outlined"
              placeholder="Friday Night Poker"
              style={styles.input}
            />
            <Text style={styles.dateInfo}>
              Date: {new Date().toLocaleDateString()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateSession}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Join Session Dialog */}
        <Dialog visible={joinDialogVisible} onDismiss={() => setJoinDialogVisible(false)}>
          <Dialog.Title>Join Session</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Join Code"
              value={joinCode}
              onChangeText={setJoinCode}
              mode="outlined"
              placeholder="ABC123"
              autoCapitalize="characters"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setJoinDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleJoinSession}>Join</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
  list: {
    padding: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.card,
  },
  selectedCard: {
    borderColor: darkColors.accent,
    borderWidth: 2,
  },
  sessionInfo: {
    gap: 4,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  joinCode: {
    fontSize: 14,
    color: darkColors.textMuted,
  },
  date: {
    fontSize: 14,
    color: darkColors.textMuted,
  },
  note: {
    fontSize: 13,
    color: darkColors.textMuted,
    fontStyle: 'italic',
  },
  status: {
    fontSize: 12,
    color: darkColors.accent,
    marginTop: 4,
  },
  statusCompleted: {
    color: darkColors.positive,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  fab: {
    backgroundColor: darkColors.accent,
  },
  fabJoin: {
    backgroundColor: darkColors.surface,
  },
  input: {
    marginBottom: spacing.md,
  },
  dateInfo: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
