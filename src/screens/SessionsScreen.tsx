import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Text, Card, FAB, Button, TextInput, Portal, Dialog, IconButton, Badge } from 'react-native-paper';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSessions } from '@/hooks/useSessions';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import * as BuyInsRepo from '@/db/repositories/buyins';

type RootStackParamList = {
  SessionsList: undefined;
  SessionDetails: { sessionId: string };
};

type SessionsNavigationProp = StackNavigationProp<RootStackParamList>;

interface SwipeableSessionCardProps {
  session: any;
  isSelected: boolean;
  onPress: () => void;
  onDelete: () => void;
  pendingCount?: number;
}

function SwipeableSessionCard({ session, isSelected, onPress, onDelete, pendingCount }: SwipeableSessionCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastGestureX = useRef(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;
      lastGestureX.current = translationX;

      // If swiped left enough or with enough velocity, show delete
      if (translationX < -80 || velocityX < -500) {
        Animated.spring(translateX, {
          toValue: -120,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        // Snap back to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <View style={styles.deleteBackground}>
        <IconButton
          icon="delete"
          iconColor="white"
          size={24}
          onPress={() => {
            resetPosition();
            onDelete();
          }}
        />
      </View>
      
      {/* Main card */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-5, 5]}
      >
        <Animated.View
          style={[
            styles.swipeableCard,
            { transform: [{ translateX }] }
          ]}
        >
          <Card
            style={[
              styles.card,
              isSelected && styles.selectedCard,
            ]}
            onPress={() => {
              resetPosition();
              onPress();
            }}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionName}>{session.name}</Text>
                  <Text style={styles.joinCode}>Join code: {session.joinCode}</Text>
                  <Text style={styles.date}>{formatDate(session.date)}</Text>
                  {session.note && <Text style={styles.note}>{session.note}</Text>}
                  <Text style={[styles.status, session.status === 'completed' && styles.statusCompleted]}>
                    {session.status === 'completed' ? 'Completed' : 'Active'}
                  </Text>
                </View>
                {pendingCount && pendingCount > 0 && (
                  <Badge
                    style={styles.badge}
                    size={24}
                  >
                    {pendingCount}
                  </Badge>
                )}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

export default function SessionsScreen() {
  const navigation = useNavigation<SessionsNavigationProp>();
  const isFocused = useIsFocused();
  const { sessions, loading, refreshing, createSession, joinSession, deleteSession, refresh } = useSessions();
  const { selectedSessionId, setSelectedSession } = useAppStore();
  const { user } = useAuthStore();

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [pendingCounts, setPendingCounts] = useState<Map<string, number>>(new Map());

  // Load pending buy-in counts
  const loadPendingCounts = async () => {
    if (!user?.id) return;
    try {
      const counts = await BuyInsRepo.getPendingBuyInsCountBySession(user.id);
      setPendingCounts(counts);
    } catch (error) {
      console.error('Error loading pending counts:', error);
    }
  };

  // Load pending counts when screen comes into focus (but don't refresh sessions)
  useEffect(() => {
    if (isFocused) {
      console.log('📍 SessionsScreen focused');
      loadPendingCounts();
    }
  }, [isFocused]);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    try {
      // Use current date automatically (local timezone)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const currentDate = `${year}-${month}-${day}`; // YYYY-MM-DD format in local timezone

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
      Alert.alert('Join Session Error', error instanceof Error ? error.message : 'Invalid code');
    }
  };

  const handleSessionPress = (sessionId: string) => {
    setSelectedSession(sessionId);
    navigation.navigate('SessionDetails', { sessionId });
  };

  const handleDeleteSession = (sessionId: string, sessionName: string) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${sessionName}"?\n\nThis will hide the session from your list, but all your financial data will be preserved for stats calculations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(sessionId);
              Alert.alert('Success', 'Session hidden. Your data is still available for stats.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
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
          refreshing={refreshing}
          onRefresh={refresh}
          renderItem={({ item }) => (
            <SwipeableSessionCard
              session={item}
              isSelected={item.id === selectedSessionId}
              onPress={() => handleSessionPress(item.id)}
              onDelete={() => handleDeleteSession(item.id, item.name)}
              pendingCount={pendingCounts.get(item.id)}
            />
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
  swipeContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: darkColors.negative,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  swipeableCard: {
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: darkColors.card,
    borderRadius: 8,
  },
  selectedCard: {
    borderColor: darkColors.accent,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
    gap: 4,
  },
  badge: {
    backgroundColor: darkColors.accent,
    color: darkColors.textPrimary,
    marginLeft: spacing.sm,
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
