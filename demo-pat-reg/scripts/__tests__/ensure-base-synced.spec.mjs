import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We mock child_process before importing the script so its internals use our mock.
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

import { spawnSync } from 'node:child_process';
import { main } from '../ensure-base-synced.mjs';

describe('ensure-base-synced.mjs', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('passes when merge-base equals base HEAD', () => {
    spawnSync.mockImplementation((command, args) => {
      const argString = args.join(' ');
      if (argString.includes('fetch --no-tags --prune')) return { status: 0, stdout: '' };
      if (argString.includes('merge-base')) return { status: 0, stdout: 'commitHash123\n' };
      if (argString.includes('rev-parse')) return { status: 0, stdout: 'commitHash123\n' };
      return { status: 0, stdout: '' };
    });

    main();

    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Branch is up to date'));
    expect(exitMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('fails when merge-base does not equal base HEAD (needs rebase)', () => {
    spawnSync.mockImplementation((command, args) => {
      const argString = args.join(' ');
      if (argString.includes('fetch --no-tags --prune')) return { status: 0, stdout: '' };
      if (argString.includes('merge-base')) return { status: 0, stdout: 'oldCommitHash\n' };
      if (argString.includes('rev-parse')) return { status: 0, stdout: 'newCommitHash\n' };
      return { status: 0, stdout: '' };
    });

    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_1');
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Branch is not up to date'));
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('catches execution errors and exits with 1', () => {
    spawnSync.mockReturnValue({ status: 1, stderr: 'Git failed mysteriously' });

    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_1');
    expect(errorMock).toHaveBeenCalledWith(expect.stringContaining('Git failed mysteriously'));
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
