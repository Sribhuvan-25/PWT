import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, FAB, Card, Button, TextInput, Portal, Dialog } from 'react-native-paper';
import { useGroups } from '@/hooks/useGroups';
import { useAppStore } from '@/stores/appStore';
import { darkColors, spacing } from '@/utils/theme';
import { useNavigation } from '@react-navigation/native';

export default function GroupsScreen() {
  const { groups, loading, createGroup, deleteGroup, refresh } = useGroups();
  const { selectedGroupId, setSelectedGroup } = useAppStore();
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigation = useNavigation();

  console.log('GroupsScreen - loading:', loading, 'groups:', groups.length, groups);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const newGroup = await createGroup(groupName.trim());
      setGroupName('');
      setCreateDialogVisible(false);
      setSelectedGroup(newGroup.id);
      Alert.alert('Success', `Group "${newGroup.name}" created!\nJoin code: ${newGroup.joinCode}`);
      // Navigate to Sessions tab to view the group
      navigation.navigate('Sessions' as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;

    try {
      // Import repositories at the top level
      const { getGroupByJoinCode } = await import('@/db/repositories/groups');
      const { createMember } = await import('@/db/repositories/members');
      const { useAuthStore } = await import('@/stores/authStore');

      const user = useAuthStore.getState().user;
      const group = await getGroupByJoinCode(joinCode.trim().toUpperCase());

      if (!group) {
        Alert.alert('Error', 'Invalid join code');
        return;
      }

      // Add current user as a member
      const memberName = user?.name || user?.displayName || 'You';
      await createMember(group.id, memberName);

      setJoinCode('');
      setJoinDialogVisible(false);
      await refresh();
      setSelectedGroup(group.id);
      Alert.alert('Success', `Joined "${group.name}"!`);
      navigation.navigate('Sessions' as never);
    } catch (error) {
      console.error('Join group error:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroup(groupId);
    // Navigate to Sessions tab to view group details
    navigation.navigate('Sessions' as never);
  };

  return (
    <View style={styles.container}>
      {loading && groups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No groups yet</Text>
          <Text style={styles.emptySubtext}>Create or join a poker group!</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card
              style={[
                styles.card,
                item.id === selectedGroupId && styles.selectedCard,
              ]}
              onPress={() => handleSelectGroup(item.id)}
            >
              <Card.Content>
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.joinCode}>Join code: {item.joinCode}</Text>
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
        {/* Create Group Dialog */}
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New Group</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Group Name"
              value={groupName}
              onChangeText={setGroupName}
              mode="outlined"
              placeholder="Friday Night Poker"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateGroup}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Join Group Dialog */}
        <Dialog visible={joinDialogVisible} onDismiss={() => setJoinDialogVisible(false)}>
          <Dialog.Title>Join Group</Dialog.Title>
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
            <Button onPress={handleJoinGroup}>Join</Button>
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
  loadingText: {
    fontSize: 16,
    color: darkColors.textPrimary,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
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
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  joinCode: {
    fontSize: 14,
    color: darkColors.textMuted,
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
});
