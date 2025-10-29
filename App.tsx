import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as Notifications from 'expo-notifications';

import Navigation from './src/navigation';
import { darkTheme } from './src/utils/theme';
import { initSupabase } from './src/db/supabase';
import { useAuthStore } from './src/stores/authStore';
import { onAuthStateChange, getCurrentUser } from './src/services/auth';
import {
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './src/services/notificationService';
import * as PushTokensRepo from './src/db/repositories/pushTokens';
import { Text } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineBanner from './src/components/OfflineBanner';
import { logger } from './src/utils/logger';

export default function App() {
  const [appInitialized, setAppInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize Supabase
        initSupabase();

        // Check for existing user session
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        setAppInitialized(true);
      } catch (err) {
        logger.error('App initialization failed', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    }

    initialize();

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Register for push notifications when user logs in
  useEffect(() => {
    if (!user) return;

    async function setupPushNotifications() {
      try {
        // Register for push notifications
        const tokenData = await registerForPushNotifications();

        if (tokenData) {
          // Save token to database
          await PushTokensRepo.savePushToken(
            user.id,
            tokenData.token,
            tokenData.platform
          );
          logger.info('Push token registered and saved');
        }
      } catch (err) {
        logger.error('Failed to set up push notifications', err);
      }
    }

    setupPushNotifications();

    // Set up notification listeners
    notificationListener.current = addNotificationReceivedListener(notification => {
      logger.debug('Notification received while app in foreground');
      // You can handle foreground notifications here
    });

    responseListener.current = addNotificationResponseListener(response => {
      const data = response.notification.request.content.data;
      logger.breadcrumb('Notification tapped', { type: data.type });

      // You can add navigation logic based on notification type
      if (data.type === 'buyin-request' && data.sessionId) {
        // Navigate to session details
        logger.debug('Navigate to session from notification', { sessionId: data.sessionId });
      } else if (data.type === 'settlement-reminder' && data.sessionId) {
        // Navigate to settlements
        logger.debug('Navigate to settlements from notification', { sessionId: data.sessionId });
      }
    });

    return () => {
      // Clean up notification listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  if (!fontsLoaded || !appInitialized) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <PaperProvider theme={darkTheme}>
        <StatusBar style="light" />
        <Navigation />
        <OfflineBanner />
      </PaperProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0C0E',
  },
  loadingText: {
    color: '#EDEFF2',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
