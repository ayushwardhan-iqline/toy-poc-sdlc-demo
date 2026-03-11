import { spawnSync } from 'node:child_process';

const command = process.platform === 'win32' ? 'bun.exe' : 'bun';
const isAffectedMode = process.argv.includes('--affected');
const baseEnv = {
  ...process.env,
  HOST: process.env.HOST || '127.0.0.1',
  PORT: process.env.PORT || '3333',
};

function run(args, options = {}) {
  return spawnSync(command, args, {
    env: baseEnv,
    ...options,
  });
}

function failed(result) {
  return typeof result.status !== 'number' || result.status !== 0;
}

if (isAffectedMode) {
  const affectedResult = run(['x', 'nx', 'show', 'projects', '--affected', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  if (failed(affectedResult)) {
    console.error(affectedResult.stderr || 'Unable to resolve affected projects for backend integration.');
    process.exit(1);
  }

  let affectedProjects = [];
  try {
    affectedProjects = JSON.parse(affectedResult.stdout || '[]');
  } catch {
    console.error('Could not parse affected projects output.');
    process.exit(1);
  }

  const shouldRun = [
    '@demo-pat-reg/backend-e2e',
    'backend-e2e',
    '@demo-pat-reg/backend',
    'backend',
    '@demo-pat-reg/shared',
    'shared',
  ].some((project) => affectedProjects.includes(project));

  if (!shouldRun) {
    console.log('Skipping backend integration tests: backend scope is not affected.');
    process.exit(0);
  }
}

const integrationResult = run(['x', 'nx', 'run', 'backend-e2e:e2e', '--', '--passWithNoTests'], {
  stdio: 'inherit',
});

if (typeof integrationResult.status === 'number') {
  process.exit(integrationResult.status);
}

if (integrationResult.error) {
  console.error(integrationResult.error.message);
}

process.exit(1);
