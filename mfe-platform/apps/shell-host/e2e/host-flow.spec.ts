import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type MockCounters = {
  loginCalls: number;
  registryCalls: number;
};

type LoginPayload = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  roles: Array<'ADMIN' | 'USER'>;
};

function createJwt(username: string) {
  const header = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0';
  const userPayload = 'eyJzdWIiOiJ1c2VyIiwicm9sZXMiOlsiVVNFUiJdfQ';
  const adminPayload = 'eyJzdWIiOiJhZG1pbiIsInJvbGVzIjpbIkFETUlOIiwiVVNFUiJdfQ';
  const payload = username === 'admin' ? adminPayload : userPayload;
  return `${header}.${payload}.sig`;
}

async function mockRegistryApis(page: Page, counters: MockCounters) {
  const corsHeaders = {
    'access-control-allow-origin': 'http://localhost:6173',
    'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization, X-Session-Id, X-Request-Id, X-Correlation-Id, X-User-Id'
  };

  await page.route('http://localhost:8081/**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
        body: ''
      });
      return;
    }

    await route.fallback();
  });

  await page.route('http://localhost:8081/api/auth/login', async (route) => {
    counters.loginCalls += 1;
    const body = JSON.parse(route.request().postData() ?? '{}') as { username?: string };
    const username = body.username ?? 'user';

    const response: LoginPayload = {
      accessToken: createJwt(username),
      tokenType: 'Bearer',
      expiresInSeconds: 1800,
      roles: username === 'admin' ? ['ADMIN', 'USER'] : ['USER']
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify(response)
    });
  });

  await page.route('http://localhost:8081/api/registry', async (route) => {
    counters.registryCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        platform: 'mfe-platform',
        routes: [
          {
            id: 'accounts',
            title: 'Accounts',
            path: '/accounts',
            requiredRoles: ['USER'],
            remote: {
              scope: 'remote_accounts',
              module: './App',
              stable: {
                url: 'http://localhost:6174/assets/remoteEntry.js',
                version: '1.0.0'
              },
              canary: {
                url: 'http://localhost:6174/assets/remoteEntry.js',
                version: '1.1.0-canary'
              },
              rollout: {
                canaryEnabled: false,
                canaryPercentage: 0
              }
            }
          },
          {
            id: 'billing',
            title: 'Billing',
            path: '/billing',
            requiredRoles: ['USER'],
            remote: {
              scope: 'remote_billing',
              module: './App',
              stable: {
                url: 'http://localhost:6175/assets/remoteEntry.js',
                version: '1.0.0'
              },
              canary: {
                url: 'http://localhost:6175/assets/remoteEntry.js',
                version: '1.1.0-canary'
              },
              rollout: {
                canaryEnabled: false,
                canaryPercentage: 0
              }
            }
          }
        ]
      })
    });
  });

  await page.route('http://localhost:8081/api/telemetry', async (route) => {
    await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
  });
}

test.beforeEach(async ({ page }) => {
  (page as unknown as { __mockCounters: MockCounters }).__mockCounters = {
    loginCalls: 0,
    registryCalls: 0
  };
  const counters = (page as unknown as { __mockCounters: MockCounters }).__mockCounters;
  await mockRegistryApis(page, counters);
});

test('login then navigate between remotes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Mock Login' })).toBeVisible();
  await page.getByLabel('Username').fill('user');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Shell Host' })).toBeVisible();
  const counters = (page as unknown as { __mockCounters: MockCounters }).__mockCounters;
  expect(counters.loginCalls).toBeGreaterThan(0);
  expect(counters.registryCalls).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Accounts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Billing' })).toBeVisible();
  await expect(page).toHaveURL(/\/accounts/);
});

test('shows degraded fallback page when remote fails to load', async ({ page }) => {
  await page.route('http://localhost:8081/api/registry', async (route) => {
    const corsHeaders = {
      'access-control-allow-origin': 'http://localhost:6173',
      'access-control-allow-methods': 'GET,POST,PUT,OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization, X-Session-Id, X-Request-Id, X-Correlation-Id, X-User-Id'
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: corsHeaders,
      body: JSON.stringify({
        platform: 'mfe-platform',
        routes: [
          {
            id: 'accounts',
            title: 'Accounts',
            path: '/accounts',
            requiredRoles: ['USER'],
            remote: {
              scope: 'remote_accounts',
              module: './DoesNotExist',
              stable: {
                url: 'http://localhost:6174/assets/remoteEntry.js',
                version: '1.0.0'
              },
              canary: {
                url: 'http://localhost:6174/assets/remoteEntry.js',
                version: '1.1.0-canary'
              },
              rollout: {
                canaryEnabled: false,
                canaryPercentage: 0
              }
            }
          }
        ]
      })
    });
  });

  await page.goto('/');
  await page.getByLabel('Username').fill('user');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('button', { name: /retry load remote/i })).toBeVisible({ timeout: 20_000 });
});
