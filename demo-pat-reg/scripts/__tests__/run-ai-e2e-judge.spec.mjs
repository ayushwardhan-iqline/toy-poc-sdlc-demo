import { describe, it, expect, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn(() => []),
  statSync: vi.fn(() => ({ isFile: () => true, size: 128 })),
}));

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { evaluateGate, hasBlockingSeverityLabel, isPlaywrightReportPath, runAgent, stripAnsi } from '../run-ai-e2e-judge.mjs';

describe('run-ai-e2e-judge.mjs', () => {
  describe('stripAnsi', () => {
    it('removes ANSI escape codes', () => {
      expect(stripAnsi('\x1b[32mSuccess\x1b[0m')).toBe('Success');
    });
  });

  describe('hasBlockingSeverityLabel', () => {
    it('returns true for E2E blocker traces', () => {
      expect(hasBlockingSeverityLabel('This test failed due to [BLOCKER]')).toBe(true);
      expect(hasBlockingSeverityLabel('* CRITICAL UI failure')).toBe(true);
    });
  });

  describe('isPlaywrightReportPath', () => {
    it('accepts legacy playwright-report paths', () => {
      expect(isPlaywrightReportPath('apps-e2e/playwright-report/index.html')).toBe(true);
    });

    it('accepts Nx test-output playwright report paths', () => {
      expect(isPlaywrightReportPath('apps-e2e\\test-output\\playwright\\report\\index.html')).toBe(true);
    });

    it('rejects unrelated report files', () => {
      expect(isPlaywrightReportPath('apps/backend-e2e/test-output/vitest/coverage/index.html')).toBe(false);
    });
  });

  describe('evaluateGate', () => {
    it('fails without CI_DECISION contract', () => {
      expect(evaluateGate('I think E2E is fine').ok).toBe(false);
    });

    it('fails on explicit CI_DECISION: FAIL', () => {
      const res = evaluateGate('E2E coverage is bad.\nCI_DECISION: FAIL');
      expect(res.ok).toBe(false);
      expect(res.reason).toContain('Tests do not cover tasks');
    });

    it('fails on PASS but contains a BLOCKER label', () => {
      const res = evaluateGate('Found a [CRITICAL] missing test.\nCI_DECISION: PASS');
      expect(res.ok).toBe(false);
      expect(res.reason).toContain('blocker severity labels');
    });

    it('passes on CI_DECISION: PASS', () => {
      expect(evaluateGate('Auto-pass because pure backend PR.\nCI_DECISION: PASS').ok).toBe(true);
    });
  });

  describe('runAgent', () => {
    it('invokes opencode with literal command and writes the report', () => {
      spawnSync.mockReturnValue({ status: 0, stdout: 'CI_DECISION: PASS\n', stderr: '' });

      runAgent({
        title: 'E2E Test Judge',
        agentName: 'step8.5-e2e-judge',
        outputPath: 'report.md',
        attachments: ['a.txt', 'a.txt'],
        message: 'judge this',
      });

      const [command, args] = spawnSync.mock.calls[0];
      expect(command).toBe('opencode');
      expect(args[0]).toBe('run');
      expect(args[1]).toBe('judge this');
      expect(args).toContain('--agent');
      expect(args).toContain('step8.5-e2e-judge');
      expect(args).not.toContain('--print-logs');
      expect(args).toContain('--file');
      expect(args.at(-2)).toBe('--file');
      expect(args.at(-1)).toBe('a.txt');
      expect(spawnSync.mock.calls[0][2].stdio).toEqual(['ignore', 'pipe', 'pipe']);
      expect(writeFileSync).toHaveBeenCalledWith('report.md', 'CI_DECISION: PASS\n', 'utf8');
    });
  });
});
