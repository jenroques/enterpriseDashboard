export type Role = 'ADMIN' | 'USER';

export type RegistryRemoteConfig = {
  stable: {
    url: string;
    version: string;
  };
  canary: {
    url: string;
    version: string;
  };
  scope: string;
  module: string;
  rollout: {
    canaryEnabled: boolean;
    canaryPercentage: number;
  };
};

export type RegistryRoute = {
  id: string;
  title: string;
  path: string;
  requiredRoles: Role[];
  remote: RegistryRemoteConfig;
};

export type RegistryResponse = {
  platform: string;
  routes: RegistryRoute[];
};

export type RemoteLoadState = 'idle' | 'loading' | 'loaded' | 'error';

export type RemoteRuntimeStatus = {
  id: string;
  title: string;
  scope: string;
  version: string;
  variant?: 'stable' | 'canary';
  state: RemoteLoadState;
  retryCount?: number;
  degraded?: boolean;
  error?: string;
  loadedAt?: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  roles: Role[];
};

export type AuthState = {
  accessToken: string | null;
  roles: Role[];
  username: string | null;
};

export type CanaryFlag = {
  remoteId: string;
  enabled: boolean;
  rolloutPercentage: number;
};

export type ClientContext = {
  sessionId: string;
  userId: string;
};

export type TelemetryEventInput = {
  eventType: string;
  remoteId?: string;
  routeId?: string;
  level?: 'INFO' | 'WARN' | 'ERROR';
  durationMs?: number;
  message?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type TelemetryRecord = {
  timestamp: string;
  correlationId: string;
  requestId: string;
  sessionId: string;
  userId: string;
  eventType: string;
  remoteId?: string;
  routeId?: string;
  level: string;
  durationMs?: number;
  message?: string;
  metadata?: Record<string, string | number | boolean>;
};
