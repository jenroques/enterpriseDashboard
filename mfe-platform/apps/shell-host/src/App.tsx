import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Toolbar,
  Typography
} from '@mui/material';
import {
  createPlatformEventBus,
  registerPlatformEventBus,
  unregisterPlatformEventBus
} from '@mfe/platform-contracts';
import { EmptyState, ErrorState, LoadingSkeleton, PageHeader, RoleGate } from '@mfe/ui-kit';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { hasRequiredRole } from './auth';
import { CanaryControlPage } from './CanaryControlPage';
import { createSessionId } from './correlation';
import { LoginPage } from './LoginPage';
import { cacheManifest, readCachedManifest } from './manifest-cache';
import { fetchRegistry, setClientContext } from './registry';
import { RegistryContext } from './registry-context';
import { RemoteLoader } from './RemoteLoader';
import { RemoteStatusPage } from './RemoteStatusPage';
import { TelemetryDashboardPage } from './TelemetryDashboardPage';
import type { AuthState, RegistryRoute, RemoteRuntimeStatus, Role } from './types';

const drawerWidth = 280;

function AccessDenied({ requiredRoles }: { requiredRoles: Role[] }) {
  return (
    <EmptyState title="Access denied" description={`Required role: ${requiredRoles.join(' or ')}.`} />
  );
}

function ShellContent({
  routes,
  authState,
  onLogout,
  onCanaryFlagsSaved
}: {
  routes: RegistryRoute[];
  authState: AuthState;
  onLogout: () => void;
  onCanaryFlagsSaved: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'info' | 'warning' | 'error' } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const platformBus = useRef(createPlatformEventBus()).current;

  useEffect(() => {
    registerPlatformEventBus(platformBus);
    return () => {
      unregisterPlatformEventBus();
    };
  }, [platformBus]);

  useEffect(() => {
    const offNavigate = platformBus.subscribe('NAVIGATE_TO_ACCOUNT', ({ accountId, route }) => {
      const path = route ?? '/accounts';
      navigate(`${path}?accountId=${encodeURIComponent(accountId)}`);
    });

    const offToast = platformBus.subscribe('SHOW_TOAST', ({ message, severity = 'info' }) => {
      setToast({ message, severity });
    });

    const offTrack = platformBus.subscribe('TRACK_EVENT', ({ name, properties }) => {
      console.info('[platform-track-event]', name, properties ?? {});
    });

    return () => {
      offNavigate();
      offToast();
      offTrack();
    };
  }, [navigate, platformBus]);

  const [statuses, setStatuses] = useState<Record<string, RemoteRuntimeStatus>>(() => {
    return routes.reduce<Record<string, RemoteRuntimeStatus>>((accumulator, route) => {
      accumulator[route.remote.scope] = {
        id: route.id,
        title: route.title,
        scope: route.remote.scope,
        version: route.remote.stable.version,
        variant: 'stable',
        state: 'idle'
      };
      return accumulator;
    }, {});
  });

  useEffect(() => {
    setStatuses((previous) => {
      const next = { ...previous };
      routes.forEach((route) => {
        if (!next[route.remote.scope]) {
          next[route.remote.scope] = {
            id: route.id,
            title: route.title,
            scope: route.remote.scope,
            version: route.remote.stable.version,
            variant: 'stable',
            state: 'idle'
          };
        }
      });
      return next;
    });
  }, [routes]);

  const updateRemoteStatus = useCallback((scope: string, status: Partial<RemoteRuntimeStatus>) => {
    setStatuses((previous) => {
      const current = previous[scope];
      if (!current) {
        return previous;
      }

      const unchanged = Object.entries(status).every(([key, value]) => {
        const typedKey = key as keyof RemoteRuntimeStatus;
        return current[typedKey] === value;
      });

      if (unchanged) {
        return previous;
      }

      return {
        ...previous,
        [scope]: {
          ...current,
          ...status
        }
      };
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      routes,
      statuses,
      updateRemoteStatus
    }),
    [routes, statuses, updateRemoteStatus]
  );

  const hasDegradedRemote = Object.values(statuses).some((status) => status.degraded || status.state === 'error');

  const navItems = [
    ...routes
      .filter((route) => hasRequiredRole(authState.roles, route.requiredRoles))
      .map((route) => ({ key: route.id, label: route.title, path: route.path })),
    { key: 'debug-remotes', label: 'Remote Status', path: '/debug/remotes' },
    ...(authState.roles.includes('ADMIN')
      ? [
          { key: 'canary-control', label: 'Canary Control', path: '/admin/canary-control' },
          { key: 'telemetry', label: 'Telemetry', path: '/admin/telemetry' }
        ]
      : [])
  ];

  const firstAuthorizedPath = routes.find((route) => hasRequiredRole(authState.roles, route.requiredRoles))?.path ?? '/debug/remotes';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Typography variant="h6" noWrap>
          mfe-platform
        </Typography>
        <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
          {authState.username} ({authState.roles.join(', ')})
        </Typography>
      </Toolbar>
      <List sx={{ px: 1, py: 1, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.key}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'action.selected',
                borderLeft: 3,
                borderColor: 'primary.main',
                pl: 1.5
              }
            }}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onLogout} variant="outlined" fullWidth>
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <RegistryContext.Provider value={contextValue}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ minHeight: 68 }}>
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ color: 'text.primary' }}>
              Shell Host
            </Typography>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 1, borderColor: 'divider' }
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 1, borderColor: 'divider' }
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
          <Toolbar />
          {hasDegradedRemote ? (
            <Alert severity="warning" sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
              Degraded mode active: one or more remotes failed and fallback pages are being shown.
            </Alert>
          ) : null}
          <Box sx={{ mb: 2, px: { xs: 0.5, sm: 1 } }}>
            <PageHeader title="Shell Host" subtitle="Runtime composition of role-aware microfrontends." />
          </Box>
          <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, p: { xs: 1.5, sm: 2 } }}>
            <Routes>
              {routes.map((route) => (
                <Route
                  key={route.id}
                  path={route.path}
                  element={
                    <RoleGate
                      userRoles={authState.roles}
                      requiredRoles={route.requiredRoles}
                      fallback={<AccessDenied requiredRoles={route.requiredRoles} />}
                    >
                      <RemoteLoader route={route} userId={authState.username ?? 'anonymous'} accessToken={authState.accessToken} />
                    </RoleGate>
                  }
                />
              ))}
              <Route path="/debug/remotes" element={<RemoteStatusPage />} />
              <Route
                path="/admin/canary-control"
                element={
                  <RoleGate
                    userRoles={authState.roles}
                    requiredRoles={['ADMIN']}
                    fallback={<AccessDenied requiredRoles={['ADMIN']} />}
                  >
                    <CanaryControlPage accessToken={authState.accessToken ?? ''} onFlagsSaved={onCanaryFlagsSaved} />
                  </RoleGate>
                }
              />
              <Route
                path="/admin/telemetry"
                element={
                  <RoleGate
                    userRoles={authState.roles}
                    requiredRoles={['ADMIN']}
                    fallback={<AccessDenied requiredRoles={['ADMIN']} />}
                  >
                    <TelemetryDashboardPage accessToken={authState.accessToken ?? ''} />
                  </RoleGate>
                }
              />
              <Route path="*" element={<Navigate to={firstAuthorizedPath} replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setToast(null)} severity={toast?.severity ?? 'info'} variant="filled" sx={{ width: '100%' }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </RegistryContext.Provider>
  );
}

export default function App() {
  const [routes, setRoutes] = useState<RegistryRoute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    accessToken: null,
    roles: [],
    username: null
  });
  const [registryRevision, setRegistryRevision] = useState(0);
  const [degradedManifestNotice, setDegradedManifestNotice] = useState<string | null>(null);
  const sessionId = useRef(createSessionId()).current;

  useEffect(() => {
    setClientContext({
      sessionId,
      userId: authState.username ?? 'anonymous'
    });
  }, [authState.username, sessionId]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetchRegistry()
      .then((response) => {
        if (!ignore) {
          setRoutes(response.routes);
          cacheManifest(response);
          setDegradedManifestNotice(null);
        }
      })
      .catch((fetchError) => {
        if (!ignore) {
          const cached = readCachedManifest();
          if (cached) {
            setRoutes(cached.routes);
            setDegradedManifestNotice('Registry unavailable; using last-known-good manifest cache.');
            setError(null);
          } else {
            const message = fetchError instanceof Error ? fetchError.message : 'Unknown registry fetch error';
            setError(message);
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [registryRevision]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ width: 420 }}>
          <LoadingSkeleton lines={4} />
          <Box sx={{ mt: 1, display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={20} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <ErrorState title="Failed to load route config from app-registry" message={error} />
      </Box>
    );
  }

  if (!authState.accessToken) {
    return <LoginPage onAuthenticated={setAuthState} />;
  }

  return (
    <>
      {degradedManifestNotice ? (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          {degradedManifestNotice}
        </Alert>
      ) : null}
      <BrowserRouter>
        <ShellContent
          routes={routes}
          authState={authState}
          onLogout={() => setAuthState({ accessToken: null, roles: [], username: null })}
          onCanaryFlagsSaved={() => setRegistryRevision((current) => current + 1)}
        />
      </BrowserRouter>
    </>
  );
}
