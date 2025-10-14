import React, { useEffect, useState } from 'react';
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

import Navigation from './src/navigation';
import { darkTheme } from './src/utils/theme';
import { initSupabase } from './src/db/supabase';
import { useAuthStore } from './src/stores/authStore';
import { onAuthStateChange, getCurrentUser } from './src/services/auth';
import { Text } from 'react-native';

export default function App() {
  const [appInitialized, setAppInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

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

        // Initialize auth state
        const user = await getCurrentUser();
        setUser(user);

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
