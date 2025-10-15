import { getSupabase } from '../db/supabase';
import { User } from '../types';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

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

    console.log('Redirect URL:', redirectTo);
    console.log('Note: Add this URL to Google Cloud Console Authorized redirect URIs');

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

      console.log('OAuth result:', result);

      if (result.type === 'success' && result.url) {
        console.log('✅ OAuth succeeded, processing URL...');
        // Extract the URL params and exchange for session
        // Supabase returns tokens in the hash fragment, not query params
        const url = result.url;
        console.log('Full URL:', url);
        const hashIndex = url.indexOf('#');
        console.log('Hash index:', hashIndex);

        if (hashIndex !== -1) {
          const hashFragment = url.substring(hashIndex + 1);
          console.log('Hash fragment:', hashFragment);
          const hashParams = new URLSearchParams(hashFragment);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          console.log('Extracted tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            accessTokenLength: accessToken?.length,
            refreshTokenLength: refreshToken?.length
          });

          if (accessToken && refreshToken) {
            const { data: { session }, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error('Session error:', sessionError);
              throw sessionError;
            }

            if (session?.user) {
              console.log('User authenticated:', session.user.email);
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
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabase();

    // Sign out from Supabase (clears session and cookies)
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase sign out error:', error);
      throw error;
    }

    console.log('✅ Successfully signed out');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
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
