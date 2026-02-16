import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

const shared = {
  react: { singleton: true, requiredVersion: '^18.3.1' },
  'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
  'react-router-dom': { singleton: true, requiredVersion: '^6.30.1' },
  '@mui/material': { singleton: true, requiredVersion: '^7.3.2' }
};

const remotes = {
  remote_accounts: runtimeEnv.VITE_REMOTE_ACCOUNTS_URL ?? 'runtime:remote_accounts',
  remote_billing: runtimeEnv.VITE_REMOTE_BILLING_URL ?? 'runtime:remote_billing',
  remote_analytics: runtimeEnv.VITE_REMOTE_ANALYTICS_URL ?? 'runtime:remote_analytics'
};

export default defineConfig({
  build: {
    target: 'esnext'
  },
  plugins: [
    react(),
    federation({
      name: 'shell_host',
      remotes,
      shared
    })
  ]
});
