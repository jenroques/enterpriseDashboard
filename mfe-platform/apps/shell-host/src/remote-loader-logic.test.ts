import { describe, expect, it } from 'vitest';
import { resolveRemoteTargets, resolveRemoteVariant } from './remote-loader-logic';
import type { RegistryRoute } from './types';

const baseRoute: RegistryRoute = {
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
      url: 'http://localhost:5174/assets/remoteEntry.js?v=canary',
      version: '1.1.0-canary'
    },
    rollout: {
      canaryEnabled: true,
      canaryPercentage: 100
    }
  }
};

describe('remote-loader behavior helpers', () => {
  it('selects canary when rollout is enabled and percentage includes user', () => {
    expect(resolveRemoteVariant(baseRoute, 'user-1')).toBe('canary');
  });

  it('selects stable when canary rollout is disabled', () => {
    const route = {
      ...baseRoute,
      remote: {
        ...baseRoute.remote,
        rollout: {
          canaryEnabled: false,
          canaryPercentage: 100
        }
      }
    };

    expect(resolveRemoteVariant(route, 'user-1')).toBe('stable');
  });

  it('returns preferred and fallback targets for loader execution', () => {
    const targets = resolveRemoteTargets(baseRoute, 'user-1');

    expect(targets.variant).toBe('canary');
    expect(targets.preferred.version).toBe('1.1.0-canary');
    expect(targets.fallback.version).toBe('1.0.0');
  });
});
