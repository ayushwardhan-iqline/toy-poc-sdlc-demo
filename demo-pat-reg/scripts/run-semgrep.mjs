/* eslint-disable security/detect-non-literal-fs-filename */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cwd = resolve(process.cwd());

function runGit(args, options = {}) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return spawnSync('git', args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...options,
  });
}

function getRepoRoot() {
  const result = runGit(['rev-parse', '--show-toplevel']);
  if (result.status !== 0) {
    console.error(result.stderr || 'Failed to determine git repository root for semgrep.');
    process.exit(1);
  }

  return result.stdout.trim();
}

function runUvxSemgrep(args, env) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return spawnSync('uvx', args, { cwd, stdio: 'inherit', env });
}

function runUvToolSemgrep(args, env) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return spawnSync('uv', ['tool', 'run', ...args], { cwd, stdio: 'inherit', env });
}

function runSemgrep(paths) {
  const semgrepArgs = ['semgrep', 'scan', '--config', 'auto', '--error', ...paths];
  const semgrepEnv = {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  };

  let result = runUvxSemgrep(semgrepArgs, semgrepEnv);

  if (result.error && result.error.code === 'ENOENT') {
    result = runUvToolSemgrep(semgrepArgs, semgrepEnv);
  }

  if (typeof result.status === 'number') {
    process.exit(result.status);
  }

  console.error(result.error?.message || 'Failed to execute semgrep via uv.');
  console.error('Install uv and ensure it is available in PATH.');
  process.exit(1);
}

export function main() {
  const isAffectedMode = process.argv.includes('--affected');

  if (!isAffectedMode) {
    runSemgrep(['.']);
  }

  const base = process.env.NX_BASE;
  const head = process.env.NX_HEAD;

  if (!base || !head) {
    console.error('NX_BASE and NX_HEAD must be set for affected semgrep scans.');
    process.exit(1);
  }

  const diffResult = runGit(['diff', '--name-only', '--diff-filter=ACMR', base, head]);

  if (diffResult.status !== 0) {
    console.error(diffResult.stderr || 'Failed to compute changed files for semgrep.');
    process.exit(1);
  }

  const repoRoot = getRepoRoot();
  const changedFiles = diffResult.stdout
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
    .map((file) => resolve(repoRoot, file))
    .filter((file) => existsSync(file));

  if (changedFiles.length === 0) {
    console.log('Skipping semgrep: no affected files to scan.');
    process.exit(0);
  }

  runSemgrep(changedFiles);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
