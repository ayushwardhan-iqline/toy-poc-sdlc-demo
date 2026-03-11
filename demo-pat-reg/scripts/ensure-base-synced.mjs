import { execSync } from 'node:child_process';

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

const baseRef = process.env.CI_BASE_REF || process.env.GITHUB_BASE_REF || 'main';

try {
  console.log(`Checking if HEAD is up to date with origin/${baseRef}...`);
  run(`git fetch --no-tags --prune origin ${baseRef}`);

  const mergeBase = run(`git merge-base HEAD origin/${baseRef}`);
  const baseHead = run(`git rev-parse origin/${baseRef}`);

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
