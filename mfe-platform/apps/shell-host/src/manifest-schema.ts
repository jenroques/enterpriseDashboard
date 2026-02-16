import type { RegistryResponse, Role } from './types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid manifest: ${path} must be a non-empty string`);
  }
  return value;
}

function readNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid manifest: ${path} must be a number`);
  }
  return value;
}

function readRoles(value: unknown, path: string): Role[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid manifest: ${path} must be an array`);
  }

  const allowed: Role[] = ['ADMIN', 'USER'];
  return value.map((item, index) => {
    const role = readString(item, `${path}[${index}]`) as Role;
    if (!allowed.includes(role)) {
      throw new Error(`Invalid manifest: ${path}[${index}] must be one of ${allowed.join(', ')}`);
    }
    return role;
  });
}

export function parseRegistryResponse(input: unknown): RegistryResponse {
  if (!isObject(input)) {
    throw new Error('Invalid manifest: payload must be an object');
  }

  const platform = readString(input.platform, 'platform');
  if (!Array.isArray(input.routes)) {
    throw new Error('Invalid manifest: routes must be an array');
  }

  const routes = input.routes.map((routeValue, routeIndex) => {
    if (!isObject(routeValue)) {
      throw new Error(`Invalid manifest: routes[${routeIndex}] must be an object`);
    }

    const routePath = `routes[${routeIndex}]`;
    const id = readString(routeValue.id, `${routePath}.id`);
    const title = readString(routeValue.title, `${routePath}.title`);
    const path = readString(routeValue.path, `${routePath}.path`);
    const requiredRoles = readRoles(routeValue.requiredRoles, `${routePath}.requiredRoles`);

    if (!isObject(routeValue.remote)) {
      throw new Error(`Invalid manifest: ${routePath}.remote must be an object`);
    }

    const remote = routeValue.remote;
    const scope = readString(remote.scope, `${routePath}.remote.scope`);
    const module = readString(remote.module, `${routePath}.remote.module`);

    if (!isObject(remote.stable) || !isObject(remote.canary)) {
      throw new Error(`Invalid manifest: ${routePath}.remote stable/canary must be objects`);
    }

    const stable = {
      url: readString(remote.stable.url, `${routePath}.remote.stable.url`),
      version: readString(remote.stable.version, `${routePath}.remote.stable.version`)
    };

    const canary = {
      url: readString(remote.canary.url, `${routePath}.remote.canary.url`),
      version: readString(remote.canary.version, `${routePath}.remote.canary.version`)
    };

    if (!isObject(remote.rollout)) {
      throw new Error(`Invalid manifest: ${routePath}.remote.rollout must be an object`);
    }

    const canaryPercentage = readNumber(remote.rollout.canaryPercentage, `${routePath}.remote.rollout.canaryPercentage`);
    if (canaryPercentage < 0 || canaryPercentage > 100) {
      throw new Error(`Invalid manifest: ${routePath}.remote.rollout.canaryPercentage must be between 0 and 100`);
    }

    if (typeof remote.rollout.canaryEnabled !== 'boolean') {
      throw new Error(`Invalid manifest: ${routePath}.remote.rollout.canaryEnabled must be a boolean`);
    }

    return {
      id,
      title,
      path,
      requiredRoles,
      remote: {
        scope,
        module,
        stable,
        canary,
        rollout: {
          canaryEnabled: remote.rollout.canaryEnabled,
          canaryPercentage
        }
      }
    };
  });

  return {
    platform,
    routes
  };
}
