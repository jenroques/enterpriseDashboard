import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { LoadingSkeleton } from '@mfe/ui-kit';
import { lazy, Suspense, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  __federation_method_getRemote as getRemote,
  __federation_method_setRemote as setRemote,
  __federation_method_unwrapDefault as unwrapDefault
} from 'virtual:__federation__';
import { useRegistryContext } from './registry-context';
import { logStructured } from './logger';
import { resolveRemoteTargets } from './remote-loader-logic';
import { postTelemetryEvent } from './registry';
import { RemoteErrorBoundary } from './RemoteErrorBoundary';
import { RemoteFallbackPage } from './RemoteFallbackPage';
import { createRetrySchedule } from './retry';
import type { RegistryRoute } from './types';

const remoteComponentCache = new Map<string, Promise<ComponentType>>();
const REMOTE_LOAD_TIMEOUT_MS = 15_000;

type RemoteLoaderProps = {
  route: RegistryRoute;
  userId: string;
  accessToken: string | null;
};

function getAlternateRemoteEntryUrl(url: string): string | null {
  if (url.endsWith('/assets/remoteEntry.js')) {
    return url.replace('/assets/remoteEntry.js', '/remoteEntry.js');
  }

  if (url.endsWith('/remoteEntry.js')) {
    return url.replace('/remoteEntry.js', '/assets/remoteEntry.js');
  }

  return null;
}

function isLikelyMissingRemoteEntryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /404|ERR_ABORTED|Failed to fetch dynamically imported module/i.test(message);
}

function isNonRetryableRemoteError(error: unknown): boolean {
  return isLikelyMissingRemoteEntryError(error);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function resolveRemoteComponent(route: RegistryRoute, url: string): Promise<ComponentType> {
  const cacheKey = `${route.remote.scope}|${route.remote.module}|${url}`;
  const existing = remoteComponentCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const loadingPromise = withTimeout(
    (async () => {
      const loadFromUrl = async (targetUrl: string): Promise<ComponentType> => {
        setRemote(route.remote.scope, {
          url: targetUrl,
          format: 'esm',
          from: 'vite'
        });

        const module = await getRemote(route.remote.scope, route.remote.module);
        const component = await unwrapDefault(module);
        return component as ComponentType;
      };

      try {
        return await loadFromUrl(url);
      } catch (error) {
        const alternateUrl = getAlternateRemoteEntryUrl(url);
        if (!alternateUrl || !isLikelyMissingRemoteEntryError(error)) {
          throw error;
        }

        logStructured('warn', 'remote.load.entry_path_fallback', {
          routeId: route.id,
          scope: route.remote.scope,
          originalUrl: url,
          fallbackUrl: alternateUrl,
          error: error instanceof Error ? error.message : String(error)
        });

        return loadFromUrl(alternateUrl);
      }
    })(),
    REMOTE_LOAD_TIMEOUT_MS,
    `Remote ${route.remote.scope}`
  ).catch((error) => {
    remoteComponentCache.delete(cacheKey);
    throw error;
  });

  remoteComponentCache.set(cacheKey, loadingPromise);
  return loadingPromise;
}

export function RemoteLoader({ route, userId, accessToken }: RemoteLoaderProps) {
  const { updateRemoteStatus } = useRegistryContext();
  const [retrySeed, setRetrySeed] = useState(0);
  const [lastError, setLastError] = useState('Remote failed to load.');

  const LazyRemote = useMemo(
    () =>
      lazy(async () => {
        const targets = resolveRemoteTargets(route, userId);
        const isCanaryCandidate = targets.variant === 'canary';
        const preferred = targets.preferred;
        const fallback = targets.fallback;
        const startedAt = performance.now();

        logStructured('info', 'remote.load.attempt', {
          routeId: route.id,
          scope: route.remote.scope,
          userId,
          variant: isCanaryCandidate ? 'canary' : 'stable',
          url: preferred.url
        });

        const retrySchedule = createRetrySchedule(3, 500, 4000);
        for (let attempt = 0; attempt <= retrySchedule.length; attempt += 1) {
          try {
            updateRemoteStatus(route.remote.scope, {
              state: 'loading',
              error: undefined,
              retryCount: attempt,
              degraded: false
            });
            const component = await resolveRemoteComponent(route, preferred.url);
            updateRemoteStatus(route.remote.scope, {
              state: 'loaded',
              version: preferred.version,
              variant: isCanaryCandidate ? 'canary' : 'stable',
              loadedAt: new Date().toISOString(),
              error: undefined,
              retryCount: attempt,
              degraded: false
            });

            const durationMs = Math.round(performance.now() - startedAt);
            logStructured('info', 'remote.load.success', {
              routeId: route.id,
              scope: route.remote.scope,
              variant: isCanaryCandidate ? 'canary' : 'stable',
              version: preferred.version,
              durationMs,
              attempts: attempt + 1
            });
            void postTelemetryEvent(accessToken, {
              eventType: 'REMOTE_LOAD_SUCCESS',
              remoteId: route.remote.scope,
              routeId: route.id,
              level: 'INFO',
              durationMs,
              metadata: {
                variant: isCanaryCandidate ? 'canary' : 'stable',
                version: preferred.version,
                attempts: attempt + 1
              }
            });

            return { default: component };
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown remote loading error';
            const durationMs = Math.round(performance.now() - startedAt);
            setLastError(message);

            if (isCanaryCandidate) {
              logStructured('warn', 'remote.load.canary_failed_fallback', {
                routeId: route.id,
                userId,
                canaryUrl: preferred.url,
                stableUrl: fallback.url,
                error: message,
                durationMs
              });

              void postTelemetryEvent(accessToken, {
                eventType: 'REMOTE_LOAD_CANARY_FAILED',
                remoteId: route.remote.scope,
                routeId: route.id,
                level: 'WARN',
                durationMs,
                message,
                metadata: {
                  canaryVersion: preferred.version,
                  stableVersion: fallback.version
                }
              });

              try {
                const fallbackComponent = await resolveRemoteComponent(route, fallback.url);
                updateRemoteStatus(route.remote.scope, {
                  state: 'loaded',
                  version: fallback.version,
                  variant: 'stable',
                  loadedAt: new Date().toISOString(),
                  error: `Canary failed, fallback to stable: ${message}`,
                  degraded: true,
                  retryCount: attempt
                });

                logStructured('info', 'remote.load.stable_fallback_success', {
                  routeId: route.id,
                  scope: route.remote.scope,
                  version: fallback.version
                });

                return { default: fallbackComponent };
              } catch (fallbackError) {
                const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown stable fallback error';
                setLastError(fallbackMessage);
                updateRemoteStatus(route.remote.scope, {
                  state: 'error',
                  error: fallbackMessage,
                  degraded: true,
                  retryCount: attempt
                });
                logStructured('error', 'remote.load.stable_fallback_failed', {
                  routeId: route.id,
                  scope: route.remote.scope,
                  error: fallbackMessage
                });

                void postTelemetryEvent(accessToken, {
                  eventType: 'REMOTE_LOAD_FAILURE',
                  remoteId: route.remote.scope,
                  routeId: route.id,
                  level: 'ERROR',
                  durationMs,
                  message: fallbackMessage,
                  metadata: {
                    attemptedVariant: 'stable-fallback'
                  }
                });

                throw fallbackError;
              }
            }

            if (attempt < retrySchedule.length) {
              if (isNonRetryableRemoteError(error)) {
                updateRemoteStatus(route.remote.scope, {
                  state: 'error',
                  error: message,
                  degraded: true,
                  retryCount: attempt
                });
                logStructured('error', 'remote.load.non_retryable_failure', {
                  routeId: route.id,
                  scope: route.remote.scope,
                  error: message,
                  attempt: attempt + 1
                });
                throw error;
              }

              const backoffMs = retrySchedule[attempt];
              logStructured('warn', 'remote.load.retry_scheduled', {
                routeId: route.id,
                scope: route.remote.scope,
                attempt: attempt + 1,
                backoffMs,
                error: message
              });
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
              continue;
            }

            updateRemoteStatus(route.remote.scope, {
              state: 'error',
              error: message,
              degraded: true,
              retryCount: attempt
            });
          logStructured('error', 'remote.load.failure', {
            routeId: route.id,
            scope: route.remote.scope,
            error: message,
            durationMs
          });
          void postTelemetryEvent(accessToken, {
            eventType: 'REMOTE_LOAD_FAILURE',
            remoteId: route.remote.scope,
            routeId: route.id,
            level: 'ERROR',
            durationMs,
            message,
            metadata: {
              attemptedVariant: isCanaryCandidate ? 'canary' : 'stable'
            }
          });
          throw error;
        }
        }

        throw new Error('Remote failed to load after retry schedule');
      }),
    [accessToken, retrySeed, route, updateRemoteStatus, userId]
  );

  return (
    <RemoteErrorBoundary
      key={`${route.id}-${retrySeed}`}
      title={route.title}
      onError={(message) => {
        setLastError((current) => (current === message ? current : message));
      }}
      fallback={
        <RemoteFallbackPage
          title={route.title}
          error={lastError}
          onRetry={() => setRetrySeed((current) => current + 1)}
        />
      }
    >
      <Suspense
        fallback={
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">Loading {route.title}...</Typography>
            </Stack>
            <LoadingSkeleton lines={3} />
          </Stack>
        }
      >
        <Box>
          <LazyRemote />
        </Box>
      </Suspense>
    </RemoteErrorBoundary>
  );
}
