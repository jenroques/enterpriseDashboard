import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const shellDistDir = path.resolve(repoRoot, 'apps/shell-host/dist');
const springStaticDir = path.resolve(repoRoot, 'services/app-registry/src/main/resources/static');

async function ensureShellBuildExists() {
  try {
    await fs.access(shellDistDir);
  } catch {
    throw new Error(`Shell build output not found at ${shellDistDir}. Run \"npm run build:frontend\" first.`);
  }
}

async function copyFrontend() {
  await ensureShellBuildExists();

  await fs.rm(springStaticDir, { recursive: true, force: true });
  await fs.mkdir(springStaticDir, { recursive: true });
  await fs.cp(shellDistDir, springStaticDir, { recursive: true });

  console.log(`[copy-frontend] Copied ${shellDistDir} -> ${springStaticDir}`);
}

copyFrontend().catch((error) => {
  console.error('[copy-frontend] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
