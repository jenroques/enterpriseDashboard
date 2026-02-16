import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:6173',
    trace: 'on-first-retry'
  },
  webServer: {
    command:
      'set VITE_REMOTE_ACCOUNTS_URL=http://localhost:6174/assets/remoteEntry.js&& ' +
      'set VITE_REMOTE_BILLING_URL=http://localhost:6175/assets/remoteEntry.js&& ' +
      'set VITE_REMOTE_ANALYTICS_URL=http://localhost:6176/assets/remoteEntry.js&& ' +
      'npx concurrently -n shell,accounts,billing,analytics -c green,cyan,magenta,yellow ' +
      '"npm run dev -w @mfe/shell-host -- --port 6173 --strictPort" ' +
      '"npm run dev -w @mfe/remote-accounts -- --port 6174 --strictPort" ' +
      '"npm run dev -w @mfe/remote-billing -- --port 6175 --strictPort" ' +
      '"npm run dev -w @mfe/remote-analytics -- --port 6176 --strictPort"',
    url: 'http://localhost:6173',
    timeout: 180_000,
    reuseExistingServer: false,
    cwd: repoRoot
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
