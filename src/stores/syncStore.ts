import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  isConnected: boolean;
  error: string | null;

  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  isConnected: true,
  error: null,

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
  setConnected: (connected) => set({ isConnected: connected }),
  setError: (error) => set({ error }),
}));
