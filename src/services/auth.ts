import { getSupabase } from '../db/supabase';
import { User } from '../types';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const supabase = getSupabase();
    
    // Create redirect URL for OAuth
    // In development, this will be exp://, in production it will use your scheme
    const redirectTo = AuthSession.makeRedirectUri({
      scheme: 'pokertracker',
      path: 'auth/callback',
      preferLocalhost: false,
      native: 'pokertracker://auth/callback'
    });

    logger.debug('OAuth redirect URL configured', { redirectTo });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: false,
        queryParams: {
          prompt: 'select_account', // Force Google to show account picker
        },
      },
    });

    if (error) throw error;

    if (data.url) {
      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      logger.debug('OAuth browser result', { type: result.type });

      if (result.type === 'success' && result.url) {
        logger.info('OAuth succeeded, processing tokens');
        // Extract the URL params and exchange for session
        // Supabase returns tokens in the hash fragment, not query params
        const url = result.url;
        const hashIndex = url.indexOf('#');

        if (hashIndex !== -1) {
          const hashFragment = url.substring(hashIndex + 1);
          const hashParams = new URLSearchParams(hashFragment);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          logger.debug('Tokens extracted', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
          });

          if (accessToken && refreshToken) {
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              logger.error('Failed to set session', sessionError);
              throw sessionError;
            }

            if (session?.user) {
              logger.info('User authenticated successfully');
              logger.setUser(session.user.id, session.user.email);
              return {
                id: session.user.id,
                email: session.user.email!,
                displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                photoUrl: session.user.user_metadata?.avatar_url,
                createdAt: session.user.created_at,
              };
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('Google sign in failed', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabase();

    // Sign out from Supabase (clears session and cookies)
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Supabase sign out error', error);
      throw error;
    }

    logger.info('User signed out successfully');
    logger.clearUser();
  } catch (error) {
    logger.error('Sign out failed', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) return null;

  // Load saved display name from AsyncStorage
  let displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
  try {
    const savedDisplayName = await AsyncStorage.getItem('user_display_name');
    if (savedDisplayName) {
      displayName = savedDisplayName;
    }
  } catch (error) {
    logger.error('Failed to load display name', error);
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    displayName,
    photoUrl: session.user.user_metadata?.avatar_url,
    createdAt: session.user.created_at,
  };
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabase();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        // Load saved display name from AsyncStorage
        let displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];
        try {
          const savedDisplayName = await AsyncStorage.getItem('user_display_name');
          if (savedDisplayName) {
            displayName = savedDisplayName;
          }
        } catch (error) {
          logger.error('Failed to load display name on auth change', error);
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          displayName,
          photoUrl: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at,
        };
        callback(user);
      } else {
        callback(null);
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}
