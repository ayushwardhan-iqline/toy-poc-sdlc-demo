import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
}));

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { main } from '../run-semgrep.mjs';

describe('run-semgrep.mjs', () => {
  let exitMock;
  let originalArgv;

  beforeEach(() => {
    vi.resetAllMocks();
    originalArgv = [...process.argv];
    exitMock = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`TEST_ABORT_EXIT_${code}`);
    });

    process.env.NX_BASE = 'origin/main';
    process.env.NX_HEAD = 'HEAD';
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
    delete process.env.NX_BASE;
    delete process.env.NX_HEAD;
  });

  it('runs semgrep on whole project when not in affected mode', () => {
    process.argv = ['node', 'run-semgrep.mjs'];
    spawnSync.mockReturnValue({ status: 0 });

    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_0');
    expect(spawnSync).toHaveBeenCalledWith(
      'uvx',
      expect.arrayContaining(['semgrep', 'scan', '--config']),
      expect.any(Object)
    );
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('fails in affected mode when NX_BASE/NX_HEAD are missing', () => {
    delete process.env.NX_BASE;
    delete process.env.NX_HEAD;
    process.argv = ['node', 'run-semgrep.mjs', '--affected'];

    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_1');
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('skips in affected mode when there are no changed files', () => {
    process.argv = ['node', 'run-semgrep.mjs', '--affected'];

    spawnSync.mockImplementation((command, args) => {
      if (command === 'git' && args.includes('--name-only')) {
        return { status: 0, stdout: 'missing-file.ts\n' };
      }
      return { status: 0 };
    });
    existsSync.mockReturnValue(false);

    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_0');
    expect(exitMock).toHaveBeenCalledWith(0);
  });
});
