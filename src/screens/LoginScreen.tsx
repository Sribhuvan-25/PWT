import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { darkColors, spacing, typography } from '../utils/theme';
import { signInWithGoogle } from '../services/auth';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await signInWithGoogle();
      if (user) {
        setUser(user);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Poker Tracker</Text>
          <Text style={styles.subtitle}>
            Track your poker games, manage groups, and settle up with friends
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? (
              <ActivityIndicator color={darkColors.textPrimary} />
            ) : (
              'Sign in with Google'
            )}
          </Button>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>

        <Text style={styles.footer}>
          Sign in to sync your data across devices
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    ...typography.h1,
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: darkColors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: darkColors.accent,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  buttonLabel: {
    ...typography.bodyMedium,
    color: darkColors.textPrimary,
  },
  errorText: {
    ...typography.caption,
    color: darkColors.negative,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  footer: {
    ...typography.caption,
    color: darkColors.textMuted,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
});
