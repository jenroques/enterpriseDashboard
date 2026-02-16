import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const springServiceDir = path.resolve(repoRoot, 'services/app-registry');
const mockRegistryScript = path.resolve(repoRoot, 'infra/scripts/mock-registry-server.mjs');

const mode = (process.env.MFE_REGISTRY_MODE ?? 'auto').toLowerCase();

function hasMaven() {
  const mavenCommand = process.platform === 'win32' ? 'mvn.cmd' : 'mvn';
  const probe = spawnSync(mavenCommand, ['-v'], {
    stdio: 'ignore'
  });

  return probe.status === 0;
}

function runProcess(command, args, cwd, label) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit'
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[registry-launcher] ${label} terminated by signal ${signal}`);
      process.exit(1);
      return;
    }

    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

const mavenAvailable = hasMaven();

if (mode === 'real') {
  if (!mavenAvailable) {
    console.error('[registry-launcher] MFE_REGISTRY_MODE=real but Maven is not available on PATH.');
    process.exit(1);
  }

  console.log('[registry-launcher] Starting real Spring registry (mvn spring-boot:run).');
  runProcess(process.platform === 'win32' ? 'mvn.cmd' : 'mvn', ['spring-boot:run'], springServiceDir, 'spring-registry');
} else if (mode === 'mock') {
  console.log('[registry-launcher] Starting mock registry server.');
  runProcess('node', [mockRegistryScript], repoRoot, 'mock-registry');
} else {
  if (mavenAvailable) {
    console.log('[registry-launcher] Auto mode selected real Spring registry (Maven detected).');
    runProcess(process.platform === 'win32' ? 'mvn.cmd' : 'mvn', ['spring-boot:run'], springServiceDir, 'spring-registry');
  } else {
    console.log('[registry-launcher] Auto mode selected mock registry (Maven not detected).');
    runProcess('node', [mockRegistryScript], repoRoot, 'mock-registry');
  }
}
