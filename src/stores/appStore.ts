import { create } from 'zustand';

interface AppState {
  selectedSessionId: string | null;
  selectedGroupId: string | null;
  isInitialized: boolean;

  setSelectedSession: (sessionId: string | null) => void;
  setSelectedGroup: (groupId: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSessionId: null,
  selectedGroupId: null,
  isInitialized: false,

  setSelectedSession: (sessionId) => set({ selectedSessionId: sessionId }),
  setSelectedGroup: (groupId) => set({ selectedGroupId: groupId }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
}));
