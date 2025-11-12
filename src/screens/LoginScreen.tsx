import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Text, ActivityIndicator, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, spacing, typography } from '../utils/theme';
import { signInWithGoogle } from '../services/auth';
import { useAuthStore } from '../stores/authStore';
import { logger } from '../utils/logger';

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
      logger.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header Section - Simplified */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="card" size={40} color={darkColors.accent} />
          </View>
          <Text style={styles.title}>Poker Tracker</Text>
          <Text style={styles.subtitle}>
            Track your games and settle up with friends
          </Text>
        </View>

        {/* Main Auth Section */}
        <View style={styles.mainSection}>
          <Card style={styles.authTile}>
            <Card.Content style={styles.authTileContent}>
              <Text style={styles.welcomeTitle}>Welcome</Text>
              <Text style={styles.welcomeSubtitle}>Sign up with Google to continue</Text>
              
              <Button
                mode="contained"
                onPress={handleGoogleSignIn}
                disabled={loading}
                style={styles.googleButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.googleButtonLabel}
                icon={() => <Ionicons name="logo-google" size={20} color={darkColors.textPrimary} />}
              >
                {loading ? (
                  <ActivityIndicator color={darkColors.textPrimary} />
                ) : (
                  'Continue with Google'
                )}
              </Button>

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={darkColors.negative} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Features Grid - Compact */}
        <View style={styles.featuresGrid}>
          <View style={styles.featureCard}>
            <Ionicons name="calendar" size={24} color={darkColors.accent} />
            <Text style={styles.featureTitle}>Sessions</Text>
            <Text style={styles.featureDescription}>Create and manage games</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="people" size={24} color={darkColors.accent} />
            <Text style={styles.featureTitle}>Players</Text>
            <Text style={styles.featureDescription}>Track multiple players</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="calculator" size={24} color={darkColors.accent} />
            <Text style={styles.featureTitle}>Settle</Text>
            <Text style={styles.featureDescription}>Auto calculations</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="stats-chart" size={24} color={darkColors.accent} />
            <Text style={styles.featureTitle}>Stats</Text>
            <Text style={styles.featureDescription}>View your results</Text>
          </View>
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: darkColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: darkColors.accent,
  },
  title: {
    ...typography.h1,
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: darkColors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  mainSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  authTile: {
    backgroundColor: darkColors.card,
    borderRadius: 16,
    width: 320,
    elevation: 12,
    shadowColor: darkColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: darkColors.border,
    alignSelf: 'center',
  },
  authTileContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  welcomeTitle: {
    ...typography.h2,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  googleButton: {
    backgroundColor: darkColors.accent,
    borderRadius: 12,
    width: '100%',
  },
  buttonContent: {
    paddingVertical: spacing.md,
  },
  googleButtonLabel: {
    color: darkColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: darkColors.negative + '20',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: darkColors.negative,
    width: '100%',
  },
  errorText: {
    ...typography.caption,
    color: darkColors.negative,
    marginLeft: spacing.sm,
    flex: 1,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  featureCard: {
    width: '48%',
    backgroundColor: darkColors.card,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: darkColors.border,
    elevation: 8,
    shadowColor: darkColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  featureTitle: {
    ...typography.bodyMedium,
    color: darkColors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  featureDescription: {
    ...typography.caption,
    color: darkColors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
