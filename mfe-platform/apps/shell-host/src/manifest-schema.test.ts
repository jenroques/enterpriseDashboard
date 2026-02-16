import { describe, expect, it } from 'vitest';
import { parseRegistryResponse } from './manifest-schema';

function validManifest() {
  return {
    platform: 'mfe-platform',
    routes: [
      {
        id: 'accounts',
        title: 'Accounts',
        path: '/accounts',
        requiredRoles: ['USER'],
        remote: {
          scope: 'remote_accounts',
          module: './routes',
          stable: {
            url: 'http://localhost:5174/assets/remoteEntry.js',
            version: '1.0.0'
          },
          canary: {
            url: 'http://localhost:5174/assets/remoteEntry.js',
            version: '1.1.0-canary'
          },
          rollout: {
            canaryEnabled: true,
            canaryPercentage: 25
          }
        }
      }
    ]
  };
}

describe('parseRegistryResponse', () => {
  it('accepts a valid manifest payload', () => {
    const parsed = parseRegistryResponse(validManifest());
    expect(parsed.platform).toBe('mfe-platform');
    expect(parsed.routes[0].remote.rollout.canaryPercentage).toBe(25);
  });

  it('rejects payload with invalid role values', () => {
    const payload = validManifest();
    payload.routes[0].requiredRoles = ['GUEST'];

    expect(() => parseRegistryResponse(payload)).toThrow(/requiredRoles\[0\]/i);
  });

  it('rejects payload with invalid rollout percentage', () => {
    const payload = validManifest();
    payload.routes[0].remote.rollout.canaryPercentage = 300;

    expect(() => parseRegistryResponse(payload)).toThrow(/between 0 and 100/i);
  });

  it('rejects payload with missing routes array', () => {
    const payload = { platform: 'mfe-platform' };

    expect(() => parseRegistryResponse(payload)).toThrow(/routes must be an array/i);
  });
});
