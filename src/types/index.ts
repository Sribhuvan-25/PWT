// Database Types

export interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  joinCode: string;
  date: string;
  note?: string;
  status?: 'active' | 'completed';
  createdAt: string;
  updatedAt?: string;
  pendingSync?: number;
}

export interface Member {
  id: string;
  sessionId: string;
  userId?: string; // Link to authenticated user (optional for existing members)
  name: string;
  createdAt: string;
  updatedAt?: string;
  pendingSync?: number;
}

export interface Result {
  id: string;
  sessionId: string;
  memberId: string;
  netCents: number;
  cashoutCents?: number;
  updatedAt: string;
  pendingSync?: number;
}

export interface BuyIn {
  id: string;
  sessionId: string;
  memberId: string;
  amountCents: number;
  createdAt: string;
  pendingSync?: number;
}

export interface SessionMember {
  userId: string;
  sessionId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Settlement {
  id: string;
  sessionId: string;
  fromMemberId: string;
  toMemberId: string;
  amountCents: number;
  settledAt: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  pendingSync?: number;
}

// Computed Types

export interface MemberBalance {
  memberId: string;
  memberName: string;
  userId?: string; // For privacy filtering
  totalCents: number;
}

export interface SettleUpTransaction {
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amountCents: number;
  isSettled?: boolean;
}

// UI State Types

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  isConnected: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export type ThemeMode = 'light' | 'dark';
