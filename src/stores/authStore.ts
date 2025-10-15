import { create } from 'zustand';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MembersRepo from '@/db/repositories/members';

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

    console.log('🔄 Updating display name to:', displayName);

    const updatedUser = { ...currentUser, displayName };
    set({ user: updatedUser });

    // Persist to AsyncStorage
    try {
      await AsyncStorage.setItem('user_display_name', displayName);
      console.log('✅ Display name saved to AsyncStorage');
    } catch (error) {
      console.error('❌ Failed to save display name:', error);
    }

    // Update all member entries in sessions for this user
    if (currentUser.id) {
      try {
        await MembersRepo.updateMemberNameByUserId(currentUser.id, displayName);
        console.log('✅ Updated member names across all sessions');
      } catch (error) {
        console.error('❌ Failed to update member names in sessions:', error);
        // Don't throw - display name update in local state succeeded
      }
    }
  },
}));
