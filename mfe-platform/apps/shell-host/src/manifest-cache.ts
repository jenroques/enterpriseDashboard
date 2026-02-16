import type { RegistryResponse } from './types';

type CachedManifestEnvelope = {
  cachedAt: number;
  expiresAt: number;
  value: RegistryResponse;
};

const CACHE_KEY = 'mfe-shell.manifest.v1';
const DEFAULT_TTL_MS = 10 * 60 * 1000;

export type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return window.localStorage;
}

export function cacheManifest(
  manifest: RegistryResponse,
  options?: { ttlMs?: number; nowMs?: number; storage?: StorageLike }
): void {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const nowMs = options?.nowMs ?? Date.now();
  const storage = getStorage(options?.storage);
  if (!storage) {
    return;
  }

  const payload: CachedManifestEnvelope = {
    cachedAt: nowMs,
    expiresAt: nowMs + ttlMs,
    value: manifest
  };

  storage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function readCachedManifest(options?: { nowMs?: number; storage?: StorageLike }): RegistryResponse | null {
  const nowMs = options?.nowMs ?? Date.now();
  const storage = getStorage(options?.storage);
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedManifestEnvelope;
    if (!parsed.expiresAt || parsed.expiresAt < nowMs) {
      storage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.value;
  } catch {
    storage.removeItem(CACHE_KEY);
    return null;
  }
}
