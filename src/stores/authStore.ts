import { create } from 'zustand';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateDisplayName: (displayName: string) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  
  updateDisplayName: async (displayName: string) => {
    const currentUser = get().user;
    if (!currentUser) return;
    
    const updatedUser = { ...currentUser, displayName };
    set({ user: updatedUser });
    
    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem('user_display_name', displayName);
    } catch (error) {
      console.error('Failed to save display name:', error);
    }
  },
}));
