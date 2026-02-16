import http from 'node:http';

const PORT = Number(process.env.PORT ?? 8081);
const ACCOUNTS_REMOTE_ENTRY_URL = process.env.ACCOUNTS_REMOTE_ENTRY_URL ?? 'http://localhost:5174/assets/remoteEntry.js';
const BILLING_REMOTE_ENTRY_URL = process.env.BILLING_REMOTE_ENTRY_URL ?? 'http://localhost:5175/assets/remoteEntry.js';
const ANALYTICS_REMOTE_ENTRY_URL = process.env.ANALYTICS_REMOTE_ENTRY_URL ?? 'http://localhost:5176/assets/remoteEntry.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id, X-Request-Id, X-Correlation-Id, X-User-Id'
};

const canaryFlags = new Map([
  ['remote-accounts', { remoteId: 'remote-accounts', enabled: false, rolloutPercentage: 0 }],
  ['remote-billing', { remoteId: 'remote-billing', enabled: false, rolloutPercentage: 0 }],
  ['remote-analytics', { remoteId: 'remote-analytics', enabled: false, rolloutPercentage: 0 }]
]);

const telemetry = [];

function toBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function issueDemoToken(username, roles) {
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      sub: username,
      roles,
      iat: now,
      exp: now + 3600,
      iss: 'mock-app-registry'
    })
  );
  return `${header}.${payload}.mock-signature`;
}

function parseTokenRoles(authorization) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return [];
  }

  const token = authorization.slice('Bearer '.length);
  const parts = token.split('.');
  if (parts.length < 2) {
    return [];
  }

  try {
    const payloadString = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadString);
    if (Array.isArray(payload.roles)) {
      return payload.roles;
    }
  } catch {
    return [];
  }

  return [];
}

function isAdmin(authorization) {
  return parseTokenRoles(authorization).includes('ADMIN');
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    ...corsHeaders,
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify(payload));
}

function sendNoContent(response) {
  response.writeHead(204, corsHeaders);
  response.end();
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk.toString('utf8');
    });

    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
  });
}

function getManifest() {
  const accountFlag = canaryFlags.get('remote-accounts');
  const billingFlag = canaryFlags.get('remote-billing');
  const analyticsFlag = canaryFlags.get('remote-analytics');

  return {
    platform: 'mfe-platform',
    routes: [
      {
        id: 'remote-accounts',
        title: 'Accounts',
        path: '/accounts',
        requiredRoles: ['USER', 'ADMIN'],
        remote: {
          scope: 'remote_accounts',
          module: './App',
          stable: {
            url: ACCOUNTS_REMOTE_ENTRY_URL,
            version: '1.0.0-stable'
          },
          canary: {
            url: ACCOUNTS_REMOTE_ENTRY_URL,
            version: '1.0.0-canary'
          },
          rollout: {
            canaryEnabled: accountFlag.enabled,
            canaryPercentage: accountFlag.rolloutPercentage
          }
        }
      },
      {
        id: 'remote-billing',
        title: 'Billing',
        path: '/billing',
        requiredRoles: ['USER', 'ADMIN'],
        remote: {
          scope: 'remote_billing',
          module: './App',
          stable: {
            url: BILLING_REMOTE_ENTRY_URL,
            version: '1.0.0-stable'
          },
          canary: {
            url: BILLING_REMOTE_ENTRY_URL,
            version: '1.0.0-canary'
          },
          rollout: {
            canaryEnabled: billingFlag.enabled,
            canaryPercentage: billingFlag.rolloutPercentage
          }
        }
      },
      {
        id: 'remote-analytics',
        title: 'Analytics',
        path: '/analytics',
        requiredRoles: ['USER', 'ADMIN'],
        remote: {
          scope: 'remote_analytics',
          module: './App',
          stable: {
            url: ANALYTICS_REMOTE_ENTRY_URL,
            version: '1.0.0-stable'
          },
          canary: {
            url: ANALYTICS_REMOTE_ENTRY_URL,
            version: '1.0.0-canary'
          },
          rollout: {
            canaryEnabled: analyticsFlag.enabled,
            canaryPercentage: analyticsFlag.rolloutPercentage
          }
        }
      }
    ]
  };
}

const server = http.createServer(async (request, response) => {
  if (!request.url || !request.method) {
    sendJson(response, 400, { error: 'Invalid request' });
    return;
  }

  if (request.method === 'OPTIONS') {
    sendNoContent(response);
    return;
  }

  if (request.url === '/api/registry' && request.method === 'GET') {
    sendJson(response, 200, getManifest());
    return;
  }

  if (request.url === '/api/registry/health' && request.method === 'GET') {
    sendJson(response, 200, { status: 'UP' });
    return;
  }

  if (request.url === '/api/auth/login' && request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      const username = typeof body.username === 'string' && body.username.length > 0 ? body.username : 'user';
      const roles = username.toLowerCase() === 'admin' ? ['ADMIN', 'USER'] : ['USER'];
      sendJson(response, 200, {
        accessToken: issueDemoToken(username, roles),
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
        roles
      });
    } catch {
      sendJson(response, 400, { error: 'Invalid login payload' });
    }
    return;
  }

  if (request.url === '/api/registry/admin/canary-flags' && request.method === 'GET') {
    if (!isAdmin(request.headers.authorization)) {
      sendJson(response, 403, { error: 'ADMIN role required' });
      return;
    }

    sendJson(response, 200, Array.from(canaryFlags.values()));
    return;
  }

  if (request.url.startsWith('/api/registry/admin/canary-flags/') && request.method === 'PUT') {
    if (!isAdmin(request.headers.authorization)) {
      sendJson(response, 403, { error: 'ADMIN role required' });
      return;
    }

    const remoteId = request.url.split('/').pop();
    if (!remoteId || !canaryFlags.has(remoteId)) {
      sendJson(response, 404, { error: 'Unknown remoteId' });
      return;
    }

    try {
      const body = await readJsonBody(request);
      const enabled = Boolean(body.enabled);
      const rolloutPercentage = Number(body.rolloutPercentage);

      if (!Number.isFinite(rolloutPercentage) || rolloutPercentage < 0 || rolloutPercentage > 100) {
        sendJson(response, 400, { error: 'rolloutPercentage must be between 0 and 100' });
        return;
      }

      const nextFlag = {
        remoteId,
        enabled,
        rolloutPercentage
      };
      canaryFlags.set(remoteId, nextFlag);
      sendJson(response, 200, nextFlag);
    } catch {
      sendJson(response, 400, { error: 'Invalid canary payload' });
    }
    return;
  }

  if (request.url === '/api/telemetry' && request.method === 'POST') {
    try {
      const body = await readJsonBody(request);
      telemetry.unshift({
        timestamp: new Date().toISOString(),
        correlationId: request.headers['x-correlation-id'] ?? 'corr-local',
        requestId: request.headers['x-request-id'] ?? 'req-local',
        sessionId: request.headers['x-session-id'] ?? 'session-local',
        userId: request.headers['x-user-id'] ?? 'anonymous',
        eventType: body.eventType ?? 'unknown',
        remoteId: body.remoteId,
        routeId: body.routeId,
        level: body.level ?? 'INFO',
        durationMs: body.durationMs,
        message: body.message,
        metadata: body.metadata ?? {}
      });

      while (telemetry.length > 500) {
        telemetry.pop();
      }

      sendNoContent(response);
    } catch {
      sendJson(response, 400, { error: 'Invalid telemetry payload' });
    }
    return;
  }

  if (request.url === '/api/admin/telemetry' && request.method === 'GET') {
    if (!isAdmin(request.headers.authorization)) {
      sendJson(response, 403, { error: 'ADMIN role required' });
      return;
    }

    sendJson(response, 200, telemetry);
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.warn('[mock-registry] Port 8081 is already in use; using existing registry instance.');
    process.exit(0);
  }

  console.error('[mock-registry] Server error', error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`[mock-registry] Running at http://localhost:${PORT}`);
});
