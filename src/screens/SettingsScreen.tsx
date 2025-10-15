import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, List, Button } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/auth';
import { darkColors, spacing } from '@/utils/theme';

export default function SettingsScreen() {
  const { user, setUser } = useAuthStore();

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
              console.error('Error signing out:', error);
              // Still clear local state even if server sign-out fails
              setUser(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader style={styles.subheader}>Account</List.Subheader>
        <List.Item
          title={user?.name || user?.displayName || 'User'}
          titleStyle={styles.itemTitle}
          description={user?.email}
          descriptionStyle={styles.itemDescription}
          left={(props) => <List.Icon {...props} icon="account" color={darkColors.textPrimary} />}
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
});
