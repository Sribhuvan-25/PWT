// Database Types

export interface User {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  updatedAt?: string;
  pendingSync?: number;
}

export interface Member {
  id: string;
  groupId: string;
  userId?: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  pendingSync?: number;
}

export interface Session {
  id: string;
  groupId: string;
  date: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
  pendingSync?: number;
}

export interface Result {
  id: string;
  sessionId: string;
  memberId: string;
  netCents: number;
  updatedAt: string;
  pendingSync?: number;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface Settlement {
  id: string;
  groupId: string;
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
