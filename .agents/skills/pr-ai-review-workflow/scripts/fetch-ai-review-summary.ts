/**
 * Fetches AI Review workflow output for a GitHub PR into local-notes/.
 *
 * Requires `gh` on PATH and authentication (see .agents/skills/gh-cli/SKILL.md):
 * - Prefer GH_TOKEN or GITHUB_TOKEN for automation, or
 * - Interactive `gh auth login` (token is read via `gh auth token` when env unset).
 *
 * Run from repo root (recommended):
 *   cd .agents/skills/pr-ai-review-workflow && npm install && npm run fetch -- --pr-url "https://github.com/owner/repo/pull/1"
 *
 * Or without installing deps in the skill folder:
 *   npx --yes tsx .agents/skills/pr-ai-review-workflow/scripts/fetch-ai-review-summary.ts --pr-url "..."
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const PR_URL_RE =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/)?(?:\?.*)?$/i;

const RUN_ID_RE = /\/actions\/runs\/(\d+)/g;
const AI_REVIEW_MARKER = '<!-- ai-review-report -->';

interface IssueComment {
  body: string;
  created_at: string;
  user?: { login?: string };
}

interface WorkflowJob {
  id: number;
  name: string;
  conclusion: string | null;
}

interface JobsResponse {
  jobs: WorkflowJob[];
}

function printErr(message: string): void {
  console.error(message);
}

function usage(): void {
  printErr(`
Usage:
  fetch-ai-review-summary.ts --pr-url <https://github.com/owner/repo/pull/N> [options]

Options:
  --out-dir <dir>   Output directory (default: local-notes at cwd)
  --run-id <id>     Skip discovery; use this Actions run database id
  --repo <o/r>      Override owner/repo (default: parsed from PR URL)

Environment (see gh-cli skill):
  GH_TOKEN | GITHUB_TOKEN   Bearer token for API and summary_raw fetch
`);
}

function parseArgs(argv: string[]): {
  prUrl?: string;
  outDir: string;
  runId?: string;
  repo?: string;
} {
  const out: {
    prUrl?: string;
    outDir: string;
    runId?: string;
    repo?: string;
  } = { outDir: path.join(process.cwd(), 'local-notes') };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      usage();
      process.exit(0);
    }
    if (a === '--pr-url') {
      out.prUrl = argv[++i];
      continue;
    }
    if (a === '--out-dir') {
      out.outDir = argv[++i];
      continue;
    }
    if (a === '--run-id') {
      out.runId = argv[++i];
      continue;
    }
    if (a === '--repo') {
      out.repo = argv[++i];
      continue;
    }
    if (a.startsWith('-')) {
      printErr(`Unknown flag: ${a}`);
      usage();
      process.exit(2);
    }
    if (!out.prUrl && PR_URL_RE.test(a)) {
      out.prUrl = a;
    }
  }
  return out;
}

function execGh(args: string[], repo?: string): string {
  const full = repo ? [...args, '--repo', repo] : args;
  return execFileSync('gh', full, {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

function parsePrUrl(
  prUrl: string,
): { owner: string; repo: string; number: number } | null {
  const m = prUrl.trim().match(PR_URL_RE);
  if (!m) return null;
  return {
    owner: m[1],
    repo: m[2],
    number: parseInt(m[3], 10),
  };
}

function resolveToken(): string {
  const fromEnv = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (fromEnv?.trim()) return fromEnv.trim();
  return execGh(['auth', 'token']).trim();
}

function extractRunIdsFromText(text: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(RUN_ID_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    ids.push(m[1]);
  }
  return ids;
}

function discoverRunIdFromComments(
  owner: string,
  repo: string,
  prNumber: number,
): string | null {
  const raw = execGh([
    'api',
    `-H`,
    `Accept: application/vnd.github+json`,
    `repos/${owner}/${repo}/issues/${prNumber}/comments`,
    '--paginate',
  ]);
  let comments: IssueComment[];
  try {
    comments = JSON.parse(raw) as IssueComment[];
  } catch {
    printErr('Failed to parse issue comments JSON from gh api.');
    return null;
  }
  const candidates = comments
    .filter(
      (c) =>
        c.body?.includes(AI_REVIEW_MARKER) &&
        (c.user?.login === 'github-actions[bot]' ||
          c.body.includes('AI Review Completed')),
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  for (const c of candidates) {
    const ids = extractRunIdsFromText(c.body);
    if (ids.length) return ids[ids.length - 1];
  }

  for (const c of comments.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )) {
    if (!c.body?.includes('actions/runs/')) continue;
    const ids = extractRunIdsFromText(c.body);
    if (ids.length) return ids[ids.length - 1];
  }
  return null;
}

function discoverRunIdFromHeadCommit(
  repoFull: string,
  prNumber: number,
): string | null {
  const prJson = execGh(['pr', 'view', String(prNumber), '--json', 'headRefOid'], repoFull);
  let headRefOid: string;
  try {
    headRefOid = (JSON.parse(prJson) as { headRefOid: string }).headRefOid;
  } catch {
    return null;
  }
  const raw = execGh(
    [
      'run',
      'list',
      '--workflow',
      'AI Review',
      '--commit',
      headRefOid,
      '--limit',
      '5',
      '--json',
      'databaseId,createdAt',
    ],
    repoFull,
  );
  let rows: { databaseId: number; createdAt: string }[];
  try {
    rows = JSON.parse(raw) as { databaseId: number; createdAt: string }[];
  } catch {
    return null;
  }
  if (!rows.length) return null;
  rows.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return String(rows[0].databaseId);
}

async function fetchSummaryRaw(
  owner: string,
  repo: string,
  runId: string,
  jobId: number,
  token: string,
): Promise<{ ok: boolean; body: string; status: number }> {
  const url = `https://github.com/${owner}/${repo}/actions/runs/${runId}/jobs/${jobId}/summary_raw`;
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/plain, text/markdown;q=0.9, */*;q=0.8',
      'User-Agent': 'pr-ai-review-workflow-fetch',
    },
  });
  const body = await res.text();
  return { ok: res.ok, body, status: res.status };
}

async function downloadArtifactsToDir(
  repoFull: string,
  runId: string,
  destDir: string,
): Promise<void> {
  await fs.mkdir(destDir, { recursive: true });
  const artifactName = `ai-review-reports-${runId}`;
  try {
    execFileSync(
      'gh',
      [
        'run',
        'download',
        runId,
        '--dir',
        destDir,
        '--name',
        artifactName,
        '--repo',
        repoFull,
      ],
      {
        encoding: 'utf8',
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch {
    execFileSync(
      'gh',
      ['run', 'download', runId, '--dir', destDir, '--repo', repoFull],
      {
        encoding: 'utf8',
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  }
}

async function collectMarkdownFiles(root: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const rel = path.join(prefix, e.name);
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) await walk(abs, rel);
      else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
        out.set(rel, await fs.readFile(abs, 'utf8'));
      }
    }
  }
  await walk(root, '');
  return out;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args.prUrl) {
    usage();
    process.exit(2);
  }

  const parsed = parsePrUrl(args.prUrl);
  if (!parsed) {
    printErr(`Invalid PR URL: ${args.prUrl}`);
    process.exit(2);
  }

  const repoFull = args.repo ?? `${parsed.owner}/${parsed.repo}`;
  const dateStr = new Date().toISOString().slice(0, 10);
  const outFile = path.join(
    args.outDir,
    `pr-${parsed.number}-ai-review-${dateStr}.md`,
  );

  const runId =
    args.runId ??
    discoverRunIdFromComments(parsed.owner, parsed.repo, parsed.number) ??
    discoverRunIdFromHeadCommit(repoFull, parsed.number);

  if (!runId) {
    printErr(
      'Could not resolve workflow run id. Re-run with --run-id <id> from the PR comment link, or ensure `gh` can read issue comments for this repo.',
    );
    process.exit(1);
  }

  const runUrl = `https://github.com/${parsed.owner}/${parsed.repo}/actions/runs/${runId}`;
  const jobsRaw = execGh([
    'api',
    `-H`,
    `Accept: application/vnd.github+json`,
    `repos/${parsed.owner}/${parsed.repo}/actions/runs/${runId}/jobs`,
  ]);

  let jobsBody: JobsResponse;
  try {
    jobsBody = JSON.parse(jobsRaw) as JobsResponse;
  } catch {
    printErr('Failed to parse jobs JSON from gh api.');
    process.exit(1);
  }

  const token = resolveToken();
  const sections: string[] = [];

  sections.push(`# AI review capture — PR #${parsed.number} — ${dateStr}`);
  sections.push('');
  sections.push(`- **PR:** ${args.prUrl}`);
  sections.push(`- **Workflow run:** ${runUrl}`);
  sections.push(`- **Run id:** ${runId}`);
  sections.push('');

  let gotSummary = false;
  for (const job of jobsBody.jobs ?? []) {
    const summaryUrl = `https://github.com/${parsed.owner}/${parsed.repo}/actions/runs/${runId}/jobs/${job.id}/summary_raw`;
    const res = await fetchSummaryRaw(
      parsed.owner,
      parsed.repo,
      runId,
      job.id,
      token,
    );
    if (res.ok && res.body.trim().length > 0 && !res.body.includes('Not Found')) {
      gotSummary = true;
      sections.push(`## Job summary: ${job.name} (${job.conclusion ?? 'unknown'})`);
      sections.push('');
      sections.push(`Source: \`${summaryUrl}\``);
      sections.push('');
      sections.push(res.body.trim());
      sections.push('');
    } else {
      sections.push(
        `<!-- summary_raw unavailable for job "${job.name}" (id ${job.id}) HTTP ${res.status} -->`,
      );
    }
  }

  const tmpArtifactRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), 'ai-review-artifacts-'),
  );
  try {
    await downloadArtifactsToDir(repoFull, runId, tmpArtifactRoot);
    const mdFiles = await collectMarkdownFiles(tmpArtifactRoot);
    if (mdFiles.size > 0) {
      sections.push('## Downloaded report markdown (workflow artifacts)');
      sections.push('');
      for (const [rel, content] of [...mdFiles.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      )) {
        sections.push(`### ${rel || '(root)'}`);
        sections.push('');
        sections.push(content.trimEnd());
        sections.push('');
      }
    } else if (!gotSummary) {
      sections.push(
        '## Artifacts',
        '',
        'No `.md` files found under downloaded artifacts and no job summary_raw content. Confirm the run uploaded `ai-review-reports-<run_id>` and that your token can read Actions artifacts (`repo` scope).',
        '',
      );
    }
  } finally {
    await fs.rm(tmpArtifactRoot, { recursive: true, force: true });
  }

  await fs.mkdir(args.outDir, { recursive: true });
  await fs.writeFile(outFile, `${sections.join('\n')}\n`, 'utf8');

  console.log(`Wrote ${path.resolve(outFile)}`);
  if (!gotSummary && sections.some((s) => s.includes('summary_raw unavailable'))) {
    console.log(
      'Note: GitHub sometimes returns 404 for summary_raw even with a valid token; artifact sections above are the reliable source.',
    );
  }
}

main().catch((e) => {
  printErr(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
