/* eslint-disable sonarjs/no-os-command-from-path */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function runGit(args) {
  const result = spawnSync('git', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `git ${args.join(' ')} failed`);
  }

  return (result.stdout || '').trim();
}

const baseRef = process.env.CI_BASE_REF || process.env.GITHUB_BASE_REF || 'main';

export function main() {
  try {
    console.log(`Checking if HEAD is up to date with origin/${baseRef}...`);
    runGit(['fetch', '--no-tags', '--prune', 'origin', baseRef]);

    const remoteRef = `origin/${baseRef}`;
    const mergeBase = runGit(['merge-base', 'HEAD', remoteRef]);
    const baseHead = runGit(['rev-parse', remoteRef]);

    if (mergeBase !== baseHead) {
      console.error(
        `Branch is not up to date with origin/${baseRef}. Please rebase or merge the latest base branch changes.`
      );
      process.exit(1);
    }

    console.log(`Branch is up to date with origin/${baseRef}.`);
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : 'Unknown error during base sync check.';
    console.error(message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
