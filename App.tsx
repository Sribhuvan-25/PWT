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
        console.error('Initialization failed:', err);
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
          console.log('Push token saved to database');
        }
      } catch (err) {
        console.error('Error setting up push notifications:', err);
      }
    }

    setupPushNotifications();

    // Set up notification listeners
    notificationListener.current = addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can handle foreground notifications here
    });

    responseListener.current = addNotificationResponseListener(response => {
      console.log('Notification tapped:', response);
      // Handle notification tap here - navigate to relevant screen
      const data = response.notification.request.content.data;

      // You can add navigation logic based on notification type
      if (data.type === 'buyin-request' && data.sessionId) {
        // Navigate to session details
        console.log('Navigate to session:', data.sessionId);
      } else if (data.type === 'settlement-reminder' && data.sessionId) {
        // Navigate to settlements
        console.log('Navigate to settlements:', data.sessionId);
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
    <PaperProvider theme={darkTheme}>
      <StatusBar style="light" />
      <Navigation />
    </PaperProvider>
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
