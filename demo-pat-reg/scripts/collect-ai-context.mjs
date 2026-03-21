/* eslint-disable security/detect-non-literal-fs-filename */
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const contextDir = resolve(projectRoot, 'reports', 'ai-context');
const prDiffPath = resolve(contextDir, 'pr.diff');
const changedFilesPath = resolve(contextDir, 'changed_files.txt');
const nxDepGraphPath = resolve(contextDir, 'nx-depgraph.json');
const manifestPath = resolve(contextDir, 'context-manifest.json');

const modeArg = process.argv.find((arg) => arg.startsWith('--mode=')) ?? '';
const mode = modeArg.split('=')[1] === 'full' ? 'full' : 'affected';

mkdirSync(contextDir, { recursive: true });

function runGit(args, options = {}) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
}

function runBunxNxGraph(outputPath) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return spawnSync('bun', ['x', 'nx', 'graph', `--file=${outputPath}`], {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
  });
}

function runGitOrThrow(args, errorMessage) {
  const result = runGit(args);
  if (result.error) {
    throw new Error(`Failed to execute git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    throw new Error(stderr || errorMessage);
  }
  return result.stdout ?? '';
}

function hasRef(ref) {
  const result = runGit(['rev-parse', '--verify', ref]);
  if (result.error) {
    throw new Error(`Failed to execute git: ${result.error.message}`);
  }
  return result.status === 0;
}

function ensureGitAvailable() {
  const result = runGit(['--version']);
  if (result.error) {
    throw new Error(`Failed to execute git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || 'git is not available in PATH.');
  }
}

function createRange(base, head, source) {
  return { base, head, source };
}

function resolveRangeFromEnv() {
  const envBase = process.env.NX_BASE?.trim();
  const envHead = process.env.NX_HEAD?.trim();
  if (!envBase || !envHead) {
    return null;
  }

  return createRange(envBase, envHead, 'NX_BASE/NX_HEAD');
}

function resolveRangeFromPreferredBase(preferredBaseRef) {
  if (/^[0-9a-f]{40}$/i.test(preferredBaseRef) && hasRef(preferredBaseRef)) {
    return createRange(preferredBaseRef, 'HEAD', `base-sha(${preferredBaseRef})`);
  }

  const remoteBaseRef = `origin/${preferredBaseRef}`;
  if (hasRef(remoteBaseRef)) {
    const mergeBaseResult = runGit(['merge-base', 'HEAD', remoteBaseRef]);
    if (mergeBaseResult.status === 0 && mergeBaseResult.stdout?.trim()) {
      return createRange(mergeBaseResult.stdout.trim(), 'HEAD', `merge-base(HEAD, ${remoteBaseRef})`);
    }

    return createRange(remoteBaseRef, 'HEAD', remoteBaseRef);
  }

  if (mode === 'full' && hasRef(preferredBaseRef)) {
    return createRange(preferredBaseRef, 'HEAD', preferredBaseRef);
  }

  return null;
}

function resolveRangeFromFallbacks() {
  if (hasRef('HEAD~1')) {
    return createRange('HEAD~1', 'HEAD', 'HEAD~1 fallback');
  }

  if (hasRef('HEAD')) {
    return createRange('HEAD', 'HEAD', 'HEAD fallback (empty diff)');
  }

  return null;
}

function resolveRange() {
  const envRange = resolveRangeFromEnv();
  if (envRange) {
    return envRange;
  }

  const preferredBaseRef = process.env.CI_BASE_REF?.trim() || process.env.GITHUB_BASE_REF?.trim() || 'main';
  const preferredRange = resolveRangeFromPreferredBase(preferredBaseRef);
  if (preferredRange) {
    return preferredRange;
  }

  const fallbackRange = resolveRangeFromFallbacks();
  if (fallbackRange) {
    return fallbackRange;
  }

  throw new Error('Unable to resolve a git diff range. Set NX_BASE and NX_HEAD, or ensure the repository has commits.');
}

function collectNxGraph() {
  const nxResult = runBunxNxGraph(nxDepGraphPath);
  if (nxResult.status !== 0) {
    const stderr = nxResult.stderr?.trim();
    console.warn(`Warning: nx graph generation failed. Continuing without graph. ${stderr || ''}`.trim());
    return false;
  }
  return existsSync(nxDepGraphPath);
}

function parseLinkedTasks(text) {
  if (!text) return [];
  const regex = /(?:ET|IQ)-\d+/gi;
  const matches = [...new Set(text.match(regex) || [])];
  return matches.map((m) => m.toUpperCase());
}

function findTaskDocsByIds(taskIds) {
  const docs = [];
  const dirs = [resolve(projectRoot, '..', 'engineering-tasks'), resolve(projectRoot, '..', 'user-stories')];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const hasMatch = taskIds.some((id) => file.toUpperCase().includes(id));
        if (hasMatch) {
          docs.push(resolve(dir, file));
        }
      }
    }
  }
  return docs;
}

export function main() {
  try {
    ensureGitAvailable();

    const prContextText = process.env.PR_CONTEXT?.trim() || '';
    const taskIds = parseLinkedTasks(prContextText);
    const linkedTaskDocs = findTaskDocsByIds(taskIds);

    if (process.env.REQUIRE_PR_TASKS === 'true') {
      if (taskIds.length === 0) {
        throw new Error('No user-stories or engineering-tasks could be parsed from the PR context. Please mention a task like ET-001 or IQ-002.');
      }
      if (linkedTaskDocs.length === 0) {
        throw new Error(`Tasks were mentioned (${taskIds.join(', ')}), but no matching markdown files could be found in engineering-tasks or user-stories.`);
      }
    }

    const range = resolveRange();
    const excludePatterns = [
      ':(exclude)package-lock.json',
      ':(exclude)yarn.lock',
      ':(exclude)pnpm-lock.yaml',
      ':(exclude)bun.lockb',
      ':(exclude)*.webp',
      ':(exclude)*.png',
      ':(exclude)*.jpg',
      ':(exclude)*.jpeg',
      ':(exclude)*.svg',
      ':(exclude)*.ico',
    ];

    const diffOutput = runGitOrThrow(
      ['diff', '--diff-filter=ACMR', `${range.base}`, `${range.head}`, '--', '.', ...excludePatterns],
      'Failed to collect PR diff.'
    );
    const changedFilesOutput = runGitOrThrow(
      ['diff', '--name-only', '--diff-filter=ACMR', `${range.base}`, `${range.head}`, '--', '.', ...excludePatterns],
      'Failed to collect changed files list.'
    );

    const changedFiles = changedFilesOutput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    writeFileSync(prDiffPath, diffOutput, 'utf8');
    writeFileSync(changedFilesPath, `${changedFiles.join('\n')}${changedFiles.length ? '\n' : ''}`, 'utf8');

    const hasNxGraph = collectNxGraph();

    const manifest = {
      generatedAt: new Date().toISOString(),
      mode,
      range,
      changedFileCount: changedFiles.length,
      linkedTaskDocs: linkedTaskDocs.map((p) => relative(projectRoot, p)),
      files: {
        prDiff: relative(projectRoot, prDiffPath),
        changedFiles: relative(projectRoot, changedFilesPath),
        nxDepGraph: hasNxGraph ? relative(projectRoot, nxDepGraphPath) : null,
      },
    };

    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

    console.log(`AI context collected at ${relative(projectRoot, contextDir)} (${changedFiles.length} changed files).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while collecting AI context.';
    console.error(message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
