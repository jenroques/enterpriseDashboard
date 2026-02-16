import { describe, expect, it } from 'vitest';
import type { RegistryResponse } from './types';
import { cacheManifest, readCachedManifest, type StorageLike } from './manifest-cache';

class MemoryStorage implements StorageLike {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const sampleManifest: RegistryResponse = {
  platform: 'mfe-platform',
  routes: []
};

describe('manifest-cache', () => {
  it('returns cached manifest before expiry', () => {
    const storage = new MemoryStorage();

    cacheManifest(sampleManifest, {
      storage,
      nowMs: 1_000,
      ttlMs: 5_000
    });

    const cached = readCachedManifest({ storage, nowMs: 5_500 });
    expect(cached).toEqual(sampleManifest);
  });

  it('returns null after expiry and clears stale value', () => {
    const storage = new MemoryStorage();

    cacheManifest(sampleManifest, {
      storage,
      nowMs: 1_000,
      ttlMs: 1_000
    });

    const cached = readCachedManifest({ storage, nowMs: 2_500 });
    expect(cached).toBeNull();
  });

  it('returns null for malformed cache payload', () => {
    const storage = new MemoryStorage();
    storage.setItem('mfe-shell.manifest.v1', '{malformed');

    const cached = readCachedManifest({ storage, nowMs: 1_000 });
    expect(cached).toBeNull();
  });
});
