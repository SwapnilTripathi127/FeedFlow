export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Preferences {
  id: string;
  userId: string;
  positiveInterests: string[];
  negativeInterests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InstagramAccount {
  id: string;
  userId: string;
  username: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  sessionStatus: 'valid' | 'invalid' | 'expired';
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationJob {
  id: string;
  userId: string;
  instagramAccountId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  actionType: 'warmup' | 'engagement' | 'cleanup';
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface Analytics {
  id: string;
  userId: string;
  instagramAccountId: string;
  personalizationScore: number;
  likesCount: number;
  savesCount: number;
  followsCount: number;
  skipsCount: number;
  actionsToday: number;
  timestamp: string;
}
