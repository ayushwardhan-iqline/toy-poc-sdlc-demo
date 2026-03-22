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
import { evaluateGate, hasBlockingSeverityLabel, runAgent, stripAnsi } from '../run-ai-review-step7.mjs';

describe('run-ai-review-step7.mjs', () => {
  describe('stripAnsi', () => {
    it('removes ANSI escape codes from standard output', () => {
      const input = '\x1b[31mError:\x1b[0m Something went wrong.';
      expect(stripAnsi(input)).toBe('Error: Something went wrong.');
    });

    it('handles strings without ANSI codes natively', () => {
      expect(stripAnsi('Hello World')).toBe('Hello World');
    });
  });

  describe('hasBlockingSeverityLabel', () => {
    it('returns true if SEVERITY: BLOCKER is found', () => {
      const report = 'Some context\nSEVERITY: BLOCKER\nMore text';
      expect(hasBlockingSeverityLabel(report)).toBe(true);
    });

    it('returns true if - CRITICAL is found', () => {
      const report = 'Some context\n- CRITICAL: Memory leak\nMore text';
      expect(hasBlockingSeverityLabel(report)).toBe(true);
    });

    it('returns true if [CRITICAL] is found', () => {
      const report = 'Issue 1: [CRITICAL] Buffer overflow';
      expect(hasBlockingSeverityLabel(report)).toBe(true);
    });

    it('returns false if no blocking labels are present', () => {
      const report = 'Some context\nSEVERITY: WARNING\nIssue 1: [MINOR] typo';
      expect(hasBlockingSeverityLabel(report)).toBe(false);
    });
  });

  describe('evaluateGate', () => {
    it('fails if CI_DECISION is missing', () => {
      const result = evaluateGate('Some review text without decision.');
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('missing CI_DECISION');
    });

    it('fails if CI_DECISION is FAIL', () => {
      const result = evaluateGate('Review text\nCI_DECISION: FAIL\n');
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('Arbiter reported CI_DECISION: FAIL');
    });

    it('fails if CI_DECISION is PASS but there is a CRITICAL severity block', () => {
      const result = evaluateGate('Review text\n- CRITICAL issue\nCI_DECISION: PASS\n');
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('blocker severity labels');
    });

    it('passes if CI_DECISION is PASS and no blockers exist', () => {
      const result = evaluateGate('Review text\nEverything looks good.\nCI_DECISION: PASS\n');
      expect(result.ok).toBe(true);
    });
  });

  describe('runAgent', () => {
    it('invokes opencode with literal command and writes the report', () => {
      spawnSync.mockReturnValue({ status: 0, stdout: 'CI_DECISION: PASS\n', stderr: '' });

      runAgent({
        title: 'Architecture Review',
        agentName: 'step7-architecture-review',
        outputPath: 'review.md',
        attachments: ['a.md', 'a.md'],
        message: 'review this',
      });

      const [command, args] = spawnSync.mock.calls[0];
      expect(command).toBe('opencode');
      expect(args[0]).toBe('run');
      expect(args[1]).toBe('review this');
      expect(args).toContain('--agent');
      expect(args).toContain('step7-architecture-review');
      expect(args).not.toContain('--print-logs');
      expect(args).toContain('--file');
      expect(args.at(-2)).toBe('--file');
      expect(args.at(-1)).toBe('a.md');
      expect(spawnSync.mock.calls[0][2].stdio).toEqual(['ignore', 'pipe', 'pipe']);
      expect(writeFileSync).toHaveBeenCalledWith('review.md', 'CI_DECISION: PASS\n', 'utf8');
    });
  });
});
