import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const uvxCommand = process.platform === 'win32' ? 'uvx.exe' : 'uvx';
const uvCommand = process.platform === 'win32' ? 'uv.exe' : 'uv';
const isAffectedMode = process.argv.includes('--affected');
const cwd = resolve(process.cwd());

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...options,
  });
}

function runSemgrep(paths) {
  const semgrepArgs = ['semgrep', 'scan', '--config', 'auto', '--error', ...paths];
  const semgrepEnv = {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  };

  let result = spawnSync(uvxCommand, semgrepArgs, { cwd, stdio: 'inherit', env: semgrepEnv });

  if (result.error && result.error.code === 'ENOENT') {
    result = spawnSync(uvCommand, ['tool', 'run', ...semgrepArgs], { cwd, stdio: 'inherit', env: semgrepEnv });
  }

  if (typeof result.status === 'number') {
    process.exit(result.status);
  }

  console.error(result.error?.message || 'Failed to execute semgrep via uv.');
  console.error('Install uv and ensure it is available in PATH.');
  process.exit(1);
}

if (!isAffectedMode) {
  runSemgrep(['.']);
}

const base = process.env.NX_BASE;
const head = process.env.NX_HEAD;

if (!base || !head) {
  console.error('NX_BASE and NX_HEAD must be set for affected semgrep scans.');
  process.exit(1);
}

const diffResult = run('git', ['diff', '--name-only', '--diff-filter=ACMR', base, head]);

if (diffResult.status !== 0) {
  console.error(diffResult.stderr || 'Failed to compute changed files for semgrep.');
  process.exit(1);
}

const changedFiles = diffResult.stdout
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => existsSync(resolve(cwd, file)));

if (changedFiles.length === 0) {
  console.log('Skipping semgrep: no affected files to scan.');
  process.exit(0);
}

runSemgrep(changedFiles);
