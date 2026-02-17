import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const remotes = [
  { appDir: 'apps/remote-accounts', targetDir: 'remotes/remote-accounts' },
  { appDir: 'apps/remote-billing', targetDir: 'remotes/remote-billing' },
  { appDir: 'apps/remote-analytics', targetDir: 'remotes/remote-analytics' }
];

const springStaticDir = path.resolve(repoRoot, 'services/app-registry/src/main/resources/static');

async function copyRemote(remote) {
  const sourceAssetsDir = path.resolve(repoRoot, remote.appDir, 'dist/assets');
  const sourceRemoteEntry = path.resolve(sourceAssetsDir, 'remoteEntry.js');

  const targetRootDir = path.resolve(springStaticDir, remote.targetDir);
  const targetAssetsDir = path.resolve(targetRootDir, 'assets');
  const targetRemoteEntry = path.resolve(targetRootDir, 'remoteEntry.js');

  try {
    await fs.access(sourceRemoteEntry);
  } catch {
    throw new Error(`Missing remote entry at ${sourceRemoteEntry}. Run remote builds first.`);
  }

  await fs.rm(targetRootDir, { recursive: true, force: true });
  await fs.mkdir(targetAssetsDir, { recursive: true });

  await fs.cp(sourceAssetsDir, targetAssetsDir, { recursive: true });
  await fs.copyFile(sourceRemoteEntry, targetRemoteEntry);

  console.log(`[copy-remotes] Copied ${remote.appDir} -> static/${remote.targetDir}`);
}

async function run() {
  await fs.mkdir(springStaticDir, { recursive: true });
  for (const remote of remotes) {
    await copyRemote(remote);
  }
}

run().catch((error) => {
  console.error('[copy-remotes] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
