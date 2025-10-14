import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  FAB,
  List,
  Portal,
  Dialog,
  Button,
  TextInput,
  Chip,
  Divider
} from 'react-native-paper';
import { useSessions } from '@/hooks/useSessions';
import { useMembers } from '@/hooks/useMembers';
import { useGroups } from '@/hooks/useGroups';
import { useAppStore } from '@/stores/appStore';
import { darkColors, spacing } from '@/utils/theme';
import { formatDate } from '@/utils/formatters';
import * as ResultsRepo from '@/db/repositories/results';

interface MemberResult {
  memberId: string;
  memberName: string;
  amount: string; // in dollars
}

export default function SessionsScreen() {
  const { selectedGroupId } = useAppStore();
  const { groups, loading: groupsLoading } = useGroups();
  const { sessions, loading: sessionsLoading, createSession } = useSessions(selectedGroupId);
  const { members, loading: membersLoading, addMember } = useMembers(selectedGroupId);

  const [addMemberDialogVisible, setAddMemberDialogVisible] = useState(false);
  const [createSessionDialogVisible, setCreateSessionDialogVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [memberResults, setMemberResults] = useState<MemberResult[]>([]);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    try {
      await addMember(newMemberName.trim());
      setNewMemberName('');
      setAddMemberDialogVisible(false);
      Alert.alert('Success', `${newMemberName} added to group!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const openCreateSessionDialog = () => {
    // Initialize member results with all members and empty amounts
    const initialResults: MemberResult[] = members.map((m) => ({
      memberId: m.id,
      memberName: m.name,
      amount: '',
    }));
    setMemberResults(initialResults);
    setSessionNote('');
    setCreateSessionDialogVisible(true);
  };

  const updateMemberAmount = (memberId: string, amount: string) => {
    setMemberResults((prev) =>
      prev.map((mr) =>
        mr.memberId === memberId ? { ...mr, amount } : mr
      )
    );
  };

  const handleCreateSession = async () => {
    try {
      // Validate at least one member has an amount
      const hasResults = memberResults.some((mr) => mr.amount.trim() !== '');
      if (!hasResults) {
        Alert.alert('Error', 'Please enter at least one result');
        return;
      }

      // Create session
      const now = new Date().toISOString();
      const session = await createSession(now, sessionNote.trim() || undefined);

      // Create results for members with amounts
      const results = memberResults
        .filter((mr) => mr.amount.trim() !== '')
        .map((mr) => ({
          sessionId: session.id,
          memberId: mr.memberId,
          netCents: Math.round(parseFloat(mr.amount) * 100), // Convert dollars to cents
        }));

      if (results.length > 0) {
        await ResultsRepo.createResults(results);
      }

      setCreateSessionDialogVisible(false);
      Alert.alert('Success', 'Session created!');
    } catch (error) {
      console.error('Create session error:', error);
      Alert.alert('Error', 'Failed to create session');
    }
  };

  if (!selectedGroupId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No group selected</Text>
        <Text style={styles.emptySubtext}>Select a group from the Groups tab</Text>
      </View>
    );
  }

  if (groupsLoading || !selectedGroup) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Group Header */}
        <View style={styles.header}>
          <Text style={styles.groupName}>{selectedGroup.name}</Text>
          <Text style={styles.joinCode}>Join code: {selectedGroup.joinCode}</Text>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <Button
              mode="text"
              onPress={() => setAddMemberDialogVisible(true)}
              textColor={darkColors.accent}
            >
              Add Member
            </Button>
          </View>

          {membersLoading && members.length === 0 ? (
            <Text style={styles.loadingText}>Loading members...</Text>
          ) : members.length === 0 ? (
            <Text style={styles.emptySubtext}>No members yet</Text>
          ) : (
            <View style={styles.chipContainer}>
              {members.map((member) => (
                <Chip
                  key={member.id}
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {member.name}
                </Chip>
              ))}
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Sessions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sessions</Text>

          {sessionsLoading && sessions.length === 0 ? (
            <Text style={styles.loadingText}>Loading sessions...</Text>
          ) : sessions.length === 0 ? (
            <Text style={styles.emptySubtext}>No sessions yet. Create your first game!</Text>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} style={styles.card}>
                <Card.Content>
                  <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                  {session.note && <Text style={styles.sessionNote}>{session.note}</Text>}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <FAB
        icon="plus"
        label="New Session"
        style={styles.fab}
        onPress={openCreateSessionDialog}
        disabled={members.length === 0}
      />

      {/* Add Member Dialog */}
      <Portal>
        <Dialog visible={addMemberDialogVisible} onDismiss={() => setAddMemberDialogVisible(false)}>
          <Dialog.Title>Add Member</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Member Name"
              value={newMemberName}
              onChangeText={setNewMemberName}
              mode="outlined"
              placeholder="John Doe"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddMemberDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleAddMember}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Create Session Dialog */}
      <Portal>
        <Dialog
          visible={createSessionDialogVisible}
          onDismiss={() => setCreateSessionDialogVisible(false)}
          style={styles.sessionDialog}
        >
          <Dialog.Title>New Session</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.dialogContent}>
                <TextInput
                  label="Note (optional)"
                  value={sessionNote}
                  onChangeText={setSessionNote}
                  mode="outlined"
                  placeholder="Friday night game"
                  style={styles.noteInput}
                />

                <Text style={styles.dialogSubtitle}>Enter results for each player:</Text>
                <Text style={styles.dialogHint}>
                  Positive = Win, Negative = Loss (e.g., +150 or -50)
                </Text>

                {memberResults.map((mr) => (
                  <TextInput
                    key={mr.memberId}
                    label={mr.memberName}
                    value={mr.amount}
                    onChangeText={(text) => updateMemberAmount(mr.memberId, text)}
                    mode="outlined"
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.resultInput}
                    left={<TextInput.Affix text="$" />}
                  />
                ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setCreateSessionDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateSession}>Create</Button>
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
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: darkColors.card,
    borderBottomWidth: 1,
    borderBottomColor: darkColors.border,
  },
  groupName: {
    fontSize: 24,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  joinCode: {
    fontSize: 14,
    color: darkColors.textMuted,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: darkColors.textPrimary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: darkColors.surface,
  },
  chipText: {
    color: darkColors.textPrimary,
  },
  divider: {
    backgroundColor: darkColors.border,
    marginVertical: spacing.md,
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
  loadingText: {
    fontSize: 14,
    color: darkColors.textMuted,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: darkColors.card,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  sessionNote: {
    fontSize: 14,
    color: darkColors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: darkColors.accent,
  },
  sessionDialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: spacing.lg,
  },
  noteInput: {
    marginBottom: spacing.lg,
  },
  dialogSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.textPrimary,
    marginBottom: spacing.xs,
  },
  dialogHint: {
    fontSize: 12,
    color: darkColors.textMuted,
    marginBottom: spacing.md,
  },
  resultInput: {
    marginBottom: spacing.md,
  },
});
