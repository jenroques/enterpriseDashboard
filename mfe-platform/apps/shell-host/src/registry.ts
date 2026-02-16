import { createRequestId } from './correlation';
import { logStructured } from './logger';
import { parseRegistryResponse } from './manifest-schema';
import type { CanaryFlag, ClientContext, LoginResponse, RegistryResponse, TelemetryEventInput, TelemetryRecord } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api').replace(/\/+$/, '');
const REGISTRY_URL = `${API_BASE_URL}/registry`;
const AUTH_URL = `${API_BASE_URL}/auth/login`;
const CANARY_FLAGS_URL = `${API_BASE_URL}/registry/admin/canary-flags`;
const TELEMETRY_URL = `${API_BASE_URL}/telemetry`;
const ADMIN_TELEMETRY_URL = `${API_BASE_URL}/admin/telemetry`;
const API_REQUEST_TIMEOUT_MS = 12_000;

let clientContext: ClientContext = {
  sessionId: 'session-unknown',
  userId: 'anonymous'
};

export function setClientContext(context: ClientContext): void {
  clientContext = context;
}

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT';
  accessToken?: string;
  body?: unknown;
  timeoutMs?: number;
};

async function apiRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const requestId = createRequestId();
  const correlationId = requestId;
  const startedAt = performance.now();
  const timeoutMs = options.timeoutMs ?? API_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Id': clientContext.sessionId,
    'X-Request-Id': requestId,
    'X-Correlation-Id': correlationId,
    'X-User-Id': clientContext.userId
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  logStructured('info', 'api.request', {
    url,
    method: options.method ?? 'GET',
    requestId,
    sessionId: clientContext.sessionId
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const durationMs = Math.round(performance.now() - startedAt);
  logStructured(response.ok ? 'info' : 'warn', 'api.response', {
    url,
    status: response.status,
    durationMs,
    requestId,
    sessionId: clientContext.sessionId
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchRegistry(): Promise<RegistryResponse> {
  const payload = await apiRequest<unknown>(REGISTRY_URL);
  try {
    return parseRegistryResponse(payload);
  } catch (error) {
    logStructured('error', 'manifest.parse.failure', {
      error: error instanceof Error ? error.message : 'Unknown manifest parse error'
    });
    throw error;
  }
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(AUTH_URL, {
    method: 'POST',
    body: { username, password }
  });
}

export async function fetchCanaryFlags(accessToken: string): Promise<CanaryFlag[]> {
  return apiRequest<CanaryFlag[]>(CANARY_FLAGS_URL, {
    accessToken
  });
}

export async function updateCanaryFlag(accessToken: string, remoteId: string, enabled: boolean, rolloutPercentage: number): Promise<CanaryFlag> {
  return apiRequest<CanaryFlag>(`${CANARY_FLAGS_URL}/${remoteId}`, {
    method: 'PUT',
    accessToken,
    body: { enabled, rolloutPercentage }
  });
}

export async function postTelemetryEvent(accessToken: string | null, event: TelemetryEventInput): Promise<void> {
  const requestId = createRequestId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Session-Id': clientContext.sessionId,
    'X-Request-Id': requestId,
    'X-Correlation-Id': requestId,
    'X-User-Id': clientContext.userId
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  await fetch(TELEMETRY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(event)
  });
}

export async function fetchAdminTelemetry(accessToken: string): Promise<TelemetryRecord[]> {
  return apiRequest<TelemetryRecord[]>(ADMIN_TELEMETRY_URL, {
    accessToken
  });
}
