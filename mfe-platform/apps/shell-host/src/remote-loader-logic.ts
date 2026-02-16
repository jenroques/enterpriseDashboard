import { isInCanaryRollout } from './rollout';
import type { RegistryRoute } from './types';

export type RemoteVariant = 'stable' | 'canary';

export function resolveRemoteVariant(route: RegistryRoute, userId: string): RemoteVariant {
  const canaryEligible =
    route.remote.rollout.canaryEnabled &&
    isInCanaryRollout(userId, route.id, route.remote.rollout.canaryPercentage);

  return canaryEligible ? 'canary' : 'stable';
}

export function resolveRemoteTargets(route: RegistryRoute, userId: string) {
  const variant = resolveRemoteVariant(route, userId);
  return {
    variant,
    preferred: variant === 'canary' ? route.remote.canary : route.remote.stable,
    fallback: route.remote.stable
  };
}
