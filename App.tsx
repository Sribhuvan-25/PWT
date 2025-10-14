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
import { useAppStore } from './src/stores/appStore';
import { useAuthStore } from './src/stores/authStore';
import { onAuthStateChange, getCurrentUser } from './src/services/auth';
import { Text } from 'react-native';

export default function App() {
  const [appInitialized, setAppInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, setInitialized } = useAppStore();
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
        console.log('🚀 Initializing app...');

        // Initialize Supabase
        initSupabase();
        console.log('✅ Supabase initialized');

        // Initialize auth state
        try {
          const user = await getCurrentUser();
          setUser(user);
        } catch (err) {
          console.warn('Auth initialization skipped:', err);
          
          // For testing: Set a dummy user if no real auth
          // You can change this UUID to test different users:
          // 
          // Alice (admin of Friday Night Poker): bb0e8400-e29b-41d4-a716-446655440001
          // Bob (member of Friday Night Poker): bb0e8400-e29b-41d4-a716-446655440002
          // Eve (admin of Weekly Tournament): bb0e8400-e29b-41d4-a716-446655440003
          // Henry (admin of High Stakes): bb0e8400-e29b-41d4-a716-446655440004
          // Jack (admin of Beginner Friendly): bb0e8400-e29b-41d4-a716-446655440005
          // 
          // Or use "test-user-123" to see all groups
          
          const testUser = {
            id: 'bb0e8400-e29b-41d4-a716-446655440001', // Alice - admin of Friday Night Poker
            email: 'alice@test.com',
            name: 'Alice Johnson',
            displayName: 'Alice Johnson',
            photoUrl: undefined,
            createdAt: new Date().toISOString(),
          };
          setUser(testUser);
          console.log('🧪 Using test user:', testUser.name);
        }

        setAppInitialized(true);
        setInitialized(true);
        console.log('✅ App initialized successfully');
      } catch (err) {
        console.error('❌ Initialization failed:', err);
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
