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
const opencodeCommand = process.env.OPENCODE_BIN_PATH?.trim() || 'opencode';

const architectureAgentPath = resolve(agentsDir, 'step7-architecture-review.md');
const qualityAgentPath = resolve(agentsDir, 'step7-code-quality-review.md');
const arbiterAgentPath = resolve(agentsDir, 'step7-arbiter-review.md');

const architectureReportPath = resolve(reportsDir, 'architecture-review.md');
const qualityReportPath = resolve(reportsDir, 'code-quality-review.md');
const finalReportPath = resolve(reportsDir, 'final-review.md');

const prDiffPath = resolve(contextDir, 'pr.diff');
const changedFilesPath = resolve(contextDir, 'changed_files.txt');
const nxDepGraphPath = resolve(contextDir, 'nx-depgraph.json');
const architectureGuidePath = resolve(repoRoot, 'docs', 'ARCHITECTURE_GUIDELINES.md');
const ciFlowPath = resolve(repoRoot, 'docs', 'INTENDED_CI_FLOW.md');

mkdirSync(reportsDir, { recursive: true });

function stripAnsi(value) {
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

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: projectRoot,
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

function listMarkdownFiles(dirPath) {
  if (!existsSync(dirPath)) {
    return [];
  }

  const output = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && fullPath.toLowerCase().endsWith('.md')) {
        output.push(fullPath);
      }
    }
  }

  return output.sort((a, b) => a.localeCompare(b));
}

function getChangedFileAttachments(limit = 50) {
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

  const result = run(process.execPath, [collectScriptPath, `--mode=${mode}`], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  if (result.error) {
    throw new Error(`Failed to execute context collector: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error('Failed to collect AI context for Step 7.');
  }
}

function runAgent({ title, agentName, outputPath, attachments, message }) {
  const uniqueAttachments = [...new Set(attachments)].filter((pathToFile) => existsSync(pathToFile));

  const args = ['run', '--model', model, '--agent', agentName, '--format', 'default', '--dir', projectRoot];
  for (const filePath of uniqueAttachments) {
    args.push('--file', filePath);
  }
  args.push(message);

  console.log(`Running ${title} with ${uniqueAttachments.length} attached files...`);

  const result = run(opencodeCommand, args);
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

function evaluateGate(reportText) {
  const decisionMatch = reportText.match(/\bCI_DECISION:\s*(PASS|FAIL)\b/i);
  if (!decisionMatch) {
    return {
      ok: false,
      reason: 'Arbiter report missing CI_DECISION: PASS|FAIL contract.',
    };
  }

  const decision = decisionMatch[1].toUpperCase();
  if (decision === 'FAIL') {
    return {
      ok: false,
      reason: 'Arbiter reported CI_DECISION: FAIL.',
    };
  }

  if (hasBlockingSeverityLabel(reportText)) {
    return {
      ok: false,
      reason: 'Arbiter report includes blocker severity labels (CRITICAL/BLOCKER).',
    };
  }

  return { ok: true, reason: 'Arbiter review passed.' };
}

function hasBlockingSeverityLabel(reportText) {
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

function pushIfExists(items, candidatePath) {
  if (existsSync(candidatePath)) {
    items.push(candidatePath);
  }
}

try {
  if (!process.env.OPENCODE_API_KEY?.trim()) {
    throw new Error('OPENCODE_API_KEY is required for Step 7 AI review.');
  }

  collectScriptContext();
  requiredFile(architectureAgentPath, 'architecture agent definition');
  requiredFile(qualityAgentPath, 'code quality agent definition');
  requiredFile(arbiterAgentPath, 'arbiter agent definition');

  requiredFile(prDiffPath, 'PR diff context');
  requiredFile(changedFilesPath, 'changed files context');

  const changedFileAttachments = getChangedFileAttachments();

  const architectureAttachments = [prDiffPath, changedFilesPath, architectureGuidePath, ciFlowPath, ...changedFileAttachments];
  pushIfExists(architectureAttachments, nxDepGraphPath);

  const qualityAttachments = [prDiffPath, changedFilesPath, ciFlowPath, ...changedFileAttachments];
  pushIfExists(qualityAttachments, resolve(contextDir, 'eslint-results.json'));
  pushIfExists(qualityAttachments, resolve(contextDir, 'semgrep-results.json'));

  runAgent({
    title: 'Architecture Review',
    agentName: 'step7-architecture-review',
    outputPath: architectureReportPath,
    attachments: architectureAttachments,
    message:
      'Generate the Step 7 architecture review report using the attached context. Follow the required report format exactly.',
  });

  runAgent({
    title: 'Code Quality Review',
    agentName: 'step7-code-quality-review',
    outputPath: qualityReportPath,
    attachments: qualityAttachments,
    message:
      'Generate the Step 7 code quality review report using the attached context. Follow the required report format exactly.',
  });

  const taskDocs = listMarkdownFiles(resolve(repoRoot, 'engineering-tasks'));
  const storyDocs = listMarkdownFiles(resolve(repoRoot, 'user-stories'));

  const arbiterAttachments = [architectureReportPath, qualityReportPath, prDiffPath, changedFilesPath, ...taskDocs, ...storyDocs];

  runAgent({
    title: 'Final Review',
    agentName: 'step7-arbiter-review',
    outputPath: finalReportPath,
    attachments: arbiterAttachments,
    message:
      'Synthesize the attached architecture and code quality reports, then produce the final arbiter report with the required CI_DECISION line.',
  });

  const finalReport = readFileSync(finalReportPath, 'utf8');
  const gate = evaluateGate(finalReport);

  if (!gate.ok) {
    console.error(gate.reason);
    process.exit(1);
  }

  console.log('Step 7 AI review completed successfully.');
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error in Step 7 AI review.';
  console.error(message);
  process.exit(1);
}
