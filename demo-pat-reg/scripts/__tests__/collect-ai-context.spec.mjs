import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We must mock fs and child_process before the actual import
vi.mock('node:fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  readdirSync: vi.fn(() => []),
}));

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

import { writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { main } from '../collect-ai-context.mjs';

describe('collect-ai-context.mjs', () => {
  let exitMock;
  let logMock;
  let errorMock;

  beforeEach(() => {
    vi.resetAllMocks();
    exitMock = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`TEST_ABORT_EXIT_${code}`);
    });
    logMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    process.env.NX_BASE = 'origin/main';
    process.env.NX_HEAD = 'HEAD';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NX_BASE;
    delete process.env.NX_HEAD;
  });

  it('runs successfully when git commands return expected diffs', () => {
    spawnSync.mockImplementation((command, args) => {
      const argsStr = args.join(' ');
      if (argsStr.includes('--version')) return { status: 0 };
      if (argsStr.includes('rev-parse')) return { status: 0 };

      if (argsStr.includes('diff') && !argsStr.includes('--name-only')) {
        return { status: 0, stdout: 'diff --git a/file1.js b/file1.js\n+console.log()' };
      }

      if (argsStr.includes('diff') && argsStr.includes('--name-only')) {
        return { status: 0, stdout: 'file1.js\nsrc/utils.js\n' };
      }

      if (argsStr.includes('x nx graph')) {
        return { status: 1, stderr: 'Graph failed' };
      }

      return { status: 0, stdout: '' };
    });

    try {
      main();
    } catch (e) {
      if (!e.message.includes('TEST_ABORT_EXIT_0')) throw e;
    }

    expect(writeFileSync).toHaveBeenCalledTimes(3);
    expect(exitMock).not.toHaveBeenCalled();
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('AI context collected'));
    expect(spawnSync).toHaveBeenCalledWith('git', ['--version'], expect.any(Object));
    expect(spawnSync).toHaveBeenCalledWith(
      'bun',
      expect.arrayContaining(['x', 'nx', 'graph']),
      expect.any(Object)
    );
  });

  it('fails when git is unavailable', () => {
    spawnSync.mockReturnValueOnce({ status: 1, stderr: 'git: command not found' });

    let caughtError = null;
    try {
      main();
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_1');
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('git: command not found'));
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('throws an error if diff collection fails', () => {
    spawnSync.mockImplementation((command, args) => {
      const argsStr = args.join(' ');
      if (argsStr.includes('--version')) return { status: 0 };
      if (argsStr.includes('diff')) return { status: 1, stderr: 'fatal: bad revision HEAD' };
      return { status: 0 };
    });

    let caughtError = null;
    try {
      main();
    } catch (e) {
      caughtError = e;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_1');
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('fatal: bad revision HEAD'));
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
