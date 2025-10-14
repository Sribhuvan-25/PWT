import { create } from 'zustand';
import { ThemeMode } from '@/types';

interface AppState {
  theme: ThemeMode;
  selectedGroupId: string | null;
  isInitialized: boolean;

  setTheme: (theme: ThemeMode) => void;
  setSelectedGroup: (groupId: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  selectedGroupId: null,
  isInitialized: false,

  setTheme: (theme) => set({ theme }),
  setSelectedGroup: (groupId) => set({ selectedGroupId: groupId }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
