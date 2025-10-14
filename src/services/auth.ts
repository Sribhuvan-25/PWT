import { getSupabase } from '../db/supabase';
import { User } from '../types';
import * as WebBrowser from 'expo-web-browser';
// import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<User | null> {
  try {
    // TODO: Replace with actual Supabase OAuth when Google credentials are configured
    return new Promise((resolve) => {
      Alert.prompt(
        'Sign In',
        'Enter your name to continue:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'Sign In',
            onPress: (name?: string) => {
              const userName = name?.trim() || 'Guest';
              const user: User = {
                id: Crypto.randomUUID(),
                email: `${userName.toLowerCase().replace(/\s+/g, '')}@pokertracker.local`,
                displayName: userName,
                createdAt: new Date().toISOString(),
              };
              resolve(user);
            },
          },
        ],
        'plain-text',
        'Your Name'
      );
    });

    /*
    // Uncomment this when Google OAuth is configured in Supabase:
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: AuthSession.makeRedirectUri({
          scheme: 'pokertracker',
        }),
      },
    });
    if (error) throw error;
    return null;
    */
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
    photoUrl: session.user.user_metadata?.avatar_url,
    createdAt: session.user.created_at,
  };
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  const supabase = getSupabase();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
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
