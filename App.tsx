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
import { initDatabase } from './src/db/sqlite';
import { initSupabase } from './src/db/supabase';
import { initSyncManager } from './src/db/syncManager';
import { useAppStore } from './src/stores/appStore';
import { Text } from 'react-native';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, setInitialized } = useAppStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    async function initialize() {
      try {
        console.log('🚀 Initializing app...');

        await initDatabase();
        setDbInitialized(true);

        try {
          initSupabase();
        } catch (err) {
          console.warn('Supabase initialization skipped:', err);
        }

        initSyncManager();

        setInitialized(true);
        console.log('✅ App initialized successfully');
      } catch (err) {
        console.error('❌ Initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      }
    }

    initialize();
  }, []);

  if (!fontsLoaded || !dbInitialized) {
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
