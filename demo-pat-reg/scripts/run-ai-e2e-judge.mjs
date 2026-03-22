/* eslint-disable security/detect-non-literal-fs-filename */
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const repoRoot = resolve(projectRoot, '..');
const reportsDir = resolve(projectRoot, 'reports');
const contextDir = resolve(reportsDir, 'ai-context');
const agentsDir = resolve(projectRoot, '.opencode', 'agents');

const modeArg = process.argv.find((arg) => arg.startsWith('--mode=')) ?? '';
const mode = modeArg.split('=')[1] === 'full' ? 'full' : 'affected';

const model = process.env.OPENCODE_MODEL?.trim() || 'opencode/minimax-m2.5-free';

const judgeAgentPath = resolve(agentsDir, 'step8.5-e2e-judge.md');
const finalReportPath = resolve(reportsDir, 'e2e-judge-review.md');

const prDiffPath = resolve(contextDir, 'pr.diff');
const changedFilesPath = resolve(contextDir, 'changed_files.txt');
const manifestPath = resolve(contextDir, 'context-manifest.json');

mkdirSync(reportsDir, { recursive: true });

export function stripAnsi(value) {
  let output = '';
  let index = 0;

  while (index < value.length) {
    const current = value.charCodeAt(index);
    const next = value[index + 1];

    if (current === 27 && next === '[') {
      index += 2;
      while (index < value.length && value[index] !== 'm') {
        index += 1;
      }
      if (index < value.length) {
        index += 1;
      }
      continue;
    }

    output += value[index];
    index += 1;
  }

  return output;
}

function runOpencode(args, options = {}) {
  const cwd = options.cwd ?? projectRoot;
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  return spawnSync('opencode', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
}

function runNode(args, options = {}) {
  const cwd = options.cwd ?? projectRoot;
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
    ...options,
  });
}

function requiredFile(pathToCheck, label) {
  if (!existsSync(pathToCheck)) {
    throw new Error(`Missing required ${label}: ${relative(projectRoot, pathToCheck)}`);
  }
}

function buildOpencodeRunArgs({ agentName, attachments, message }) {
  const args = ['run'];
  if (message.trim()) {
    args.push(message);
  }

  args.push('--model', model, '--agent', agentName, '--format', 'default', '--dir', projectRoot);
  for (const filePath of attachments) {
    args.push('--file', filePath);
  }

  return args;
}

function isTargetReportFile(entry, fullPath) {
  if (!entry.isFile()) return false;
  if (!fullPath.includes('playwright-report')) return false;
  return entry.name === 'index.html' || entry.name.endsWith('.json');
}

function processDirectoryEntry(entry, currentDir, stack, reports) {
  const fullPath = resolve(currentDir, entry.name);
  if (entry.isDirectory()) {
    if (entry.name !== 'node_modules' && entry.name !== '.git') {
      stack.push(fullPath);
    }
    return;
  }
  if (isTargetReportFile(entry, fullPath)) {
    reports.push(fullPath);
  }
}

function findPlaywrightReports(dirPath) {
  if (!existsSync(dirPath)) return [];
  const reports = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      processDirectoryEntry(entry, current, stack, reports);
    }
  }

  return reports;
}

function getChangedFileAttachments(limit = 10) {
  if (!existsSync(changedFilesPath)) {
    return [];
  }

  const changedFiles = readFileSync(changedFilesPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const attachments = [];
  for (const relPath of changedFiles) {
    const absolutePath = resolve(repoRoot, relPath);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const stats = statSync(absolutePath);
    if (!stats.isFile() || stats.size > 512 * 1024) {
      continue;
    }

    attachments.push(absolutePath);
    if (attachments.length >= limit) {
      break;
    }
  }

  return attachments;
}

function collectScriptContext() {
  const collectScriptPath = resolve(projectRoot, 'scripts', 'collect-ai-context.mjs');
  requiredFile(collectScriptPath, 'context collector script');

  const result = runNode([collectScriptPath, `--mode=${mode}`], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  if (result.error) {
    throw new Error(`Failed to execute context collector: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error('Failed to collect AI context for Step 8.5 Judge.');
  }
}



function readLinkedTasksFromManifest() {
  requiredFile(manifestPath, 'context manifest');
  const raw = readFileSync(manifestPath, 'utf8');
  const parsed = JSON.parse(raw);
  const docs = parsed?.linkedTaskDocs || [];
  return docs.map((p) => resolve(projectRoot, p));
}

export function runAgent({ title, agentName, outputPath, attachments, message }) {
  const uniqueAttachments = [...new Set(attachments)].filter((pathToFile) => existsSync(pathToFile));

  const args = buildOpencodeRunArgs({
    agentName,
    attachments: uniqueAttachments,
    message,
  });

  console.log(`Running ${title} with ${uniqueAttachments.length} attached files...`);

  const result = runOpencode(args);
  if (result.error) {
    throw new Error(`${title} failed.\nFailed to execute opencode: ${result.error.message}`);
  }

  const stdout = stripAnsi(result.stdout ?? '').trim();
  const stderr = stripAnsi(result.stderr ?? '').trim();

  if (result.status !== 0) {
    const errorText = [stdout, stderr].filter(Boolean).join('\n');
    throw new Error(`${title} failed.\n${errorText}`);
  }

  const report = stdout || `# ${title}\n\nNo report content was returned by opencode run.\n`;
  writeFileSync(outputPath, `${report}\n`, 'utf8');
}

export function evaluateGate(reportText) {
  const decisionMatch = reportText.match(/\bCI_DECISION:\s*(PASS|FAIL)\b/i);
  if (!decisionMatch) {
    return {
      ok: false,
      reason: 'E2E Judge report missing CI_DECISION: PASS|FAIL contract.',
    };
  }

  const decision = decisionMatch[1].toUpperCase();
  if (decision === 'FAIL') {
    return {
      ok: false,
      reason: 'E2E Judge reported CI_DECISION: FAIL. (Tests do not cover tasks / Acceptance criteria not met)',
    };
  }

  if (hasBlockingSeverityLabel(reportText)) {
    return {
      ok: false,
      reason: 'E2E Judge report includes blocker severity labels (CRITICAL/BLOCKER).',
    };
  }

  return { ok: true, reason: 'E2E Judge review passed.' };
}

export function hasBlockingSeverityLabel(reportText) {
  const lines = reportText.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim().toUpperCase();
    if (!line) {
      continue;
    }

    if (line.startsWith('SEVERITY: CRITICAL') || line.startsWith('SEVERITY: BLOCKER')) {
      return true;
    }

    if (line.startsWith('- CRITICAL') || line.startsWith('- BLOCKER')) {
      return true;
    }

    if (line.startsWith('* CRITICAL') || line.startsWith('* BLOCKER')) {
      return true;
    }

    if (line.includes('[CRITICAL]') || line.includes('[BLOCKER]')) {
      return true;
    }
  }

  return false;
}

export function main() {
  try {
    if (!process.env.OPENCODE_API_KEY?.trim()) {
      throw new Error('OPENCODE_API_KEY is required for Step 8.5 E2E Judge AI review.');
    }

    collectScriptContext();
    requiredFile(judgeAgentPath, 'Judge agent definition');
    requiredFile(prDiffPath, 'PR diff context');
    requiredFile(changedFilesPath, 'changed files context');

    const explicitTaskDocs = readLinkedTasksFromManifest();
    const changedFileAttachments = getChangedFileAttachments();
    const reportFiles = findPlaywrightReports(resolve(projectRoot));

    if (reportFiles.length === 0) {
      throw new Error('No Playwright report files found for Step 8.5 judge. Run Step 8 first.');
    }

    const judgeAttachments = [
      prDiffPath, 
      changedFilesPath, 
      ...explicitTaskDocs,
      ...changedFileAttachments,
      ...reportFiles,
    ];

    runAgent({
      title: 'E2E Test Judge',
      agentName: 'step8.5-e2e-judge',
      outputPath: finalReportPath,
      attachments: judgeAttachments,
      message:
        'Review the provided PR diff, Engineering Tasks, and Playwright E2E reports. Generate your judgement on testing adequacy and conclude with the CI_DECISION as strictly requested.',
    });

    const finalReport = readFileSync(finalReportPath, 'utf8');
    const gate = evaluateGate(finalReport);

    if (!gate.ok) {
      console.error(gate.reason);
      process.exit(1);
    }

    console.log('Step 8.5 E2E Judge review completed successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error in Step 8.5 AI Judge.';
    console.error(message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
