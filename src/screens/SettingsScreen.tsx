import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, List, Button, TextInput, Portal, Dialog } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/auth';
import { darkColors, spacing } from '@/utils/theme';
import { logger } from '@/utils/logger';

export default function SettingsScreen() {
  const { user, setUser, updateDisplayName } = useAuthStore();
  const [displayNameDialogVisible, setDisplayNameDialogVisible] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              setUser(null);
            } catch (error) {
              logger.error('Error signing out:', error);
              // Still clear local state even if server sign-out fails
              setUser(null);
            }
          },
        },
      ]
    );
  };

  const handleUpdateDisplayName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    try {
      await updateDisplayName(displayName.trim());
      setDisplayNameDialogVisible(false);
      Alert.alert('Success', 'Display name updated successfully!');
    } catch (error) {
      logger.error('Error updating display name:', error);
      Alert.alert('Error', 'Failed to update display name');
    }
  };

  const openDisplayNameDialog = () => {
    setDisplayName(user?.displayName || '');
    setDisplayNameDialogVisible(true);
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader style={styles.subheader}>Account</List.Subheader>
        <List.Item
          title={user?.displayName || 'User'}
          titleStyle={styles.itemTitle}
          description={user?.email}
          descriptionStyle={styles.itemDescription}
          left={(props) => <List.Icon {...props} icon="account" color={darkColors.textPrimary} />}
          right={(props) => <List.Icon {...props} icon="pencil" color={darkColors.textMuted} />}
          onPress={openDisplayNameDialog}
        />
        <View style={styles.signOutContainer}>
          <Button
            mode="outlined"
            onPress={handleSignOut}
            textColor={darkColors.negative}
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </View>
      </List.Section>

      <View style={styles.footer}>
        <Text style={styles.footerText}>PWT v1.0.0</Text>
        <Text style={styles.footerSubtext}>Data stored securely in the cloud</Text>
      </View>

      <Portal>
        <Dialog visible={displayNameDialogVisible} onDismiss={() => setDisplayNameDialogVisible(false)}>
          <Dialog.Title>Edit Display Name</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.textInput}
              placeholder="Enter your display name"
              maxLength={50}
            />
            <Text style={styles.helpText}>
              This is the name other players will see in sessions.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDisplayNameDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleUpdateDisplayName} mode="contained">
              Save
            </Button>
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
  subheader: {
    color: darkColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  itemTitle: {
    color: darkColors.textPrimary,
  },
  itemDescription: {
    color: darkColors.textMuted,
  },
  signOutContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  signOutButton: {
    borderColor: darkColors.negative,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    color: darkColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  footerSubtext: {
    color: darkColors.textMuted,
    fontSize: 12,
  },
  textInput: {
    marginBottom: spacing.md,
  },
  helpText: {
    color: darkColors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
