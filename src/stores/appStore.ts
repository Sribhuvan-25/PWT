import { create } from 'zustand';
import { ThemeMode } from '@/types';

interface AppState {
  theme: ThemeMode;
  selectedSessionId: string | null;
  selectedGroupId: string | null;
  isInitialized: boolean;

  setTheme: (theme: ThemeMode) => void;
  setSelectedSession: (sessionId: string | null) => void;
  setSelectedGroup: (groupId: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  selectedSessionId: null,
  selectedGroupId: null,
  isInitialized: false,

  setTheme: (theme) => set({ theme }),
  setSelectedSession: (sessionId) => set({ selectedSessionId: sessionId }),
  setSelectedGroup: (groupId) => set({ selectedGroupId: groupId }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
