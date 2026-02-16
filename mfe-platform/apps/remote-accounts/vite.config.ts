import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

const shared = {
  react: { singleton: true, requiredVersion: '^18.3.1' },
  'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
  'react-router-dom': { singleton: true, requiredVersion: '^6.30.1' },
  '@mui/material': { singleton: true, requiredVersion: '^7.3.2' }
};

export default defineConfig({
  build: {
    target: 'esnext'
  },
  plugins: [
    react(),
    federation({
      name: 'remote_accounts',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/RemoteApp.tsx',
        './routes': './src/routes.ts'
      },
      shared
    })
  ]
});
