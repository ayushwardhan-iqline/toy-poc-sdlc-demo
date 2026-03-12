import { describe, it, expect } from 'vitest';
import { evaluateGate, hasBlockingSeverityLabel, stripAnsi } from '../run-ai-e2e-judge.mjs';

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
});
