import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn(),
}));

import { spawnSync } from 'node:child_process';
import { main } from '../run-backend-integration.mjs';

describe('run-backend-integration.mjs', () => {
  let exitMock;
  let logMock;
  let originalArgv;

  beforeEach(() => {
    vi.resetAllMocks();
    originalArgv = [...process.argv];
    exitMock = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`TEST_ABORT_EXIT_${code}`);
    });
    logMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
  });

  it('skips tests if backend projects are not affected', () => {
    spawnSync.mockImplementation((command, args) => {
      if (args.includes('show')) {
        return { status: 0, stdout: JSON.stringify(['frontend', 'frontend-e2e']) };
      }
      return { status: 0 };
    });

    process.argv = [...process.argv, '--affected'];
    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_0');
    expect(logMock).toHaveBeenCalledWith(expect.stringContaining('Skipping backend integration tests'));
    expect(exitMock).toHaveBeenCalledWith(0);
    expect(spawnSync).toHaveBeenCalledTimes(1);
  });

  it('runs the tests and passes when backend projects are affected', () => {
    spawnSync.mockImplementation((command, args) => {
      if (args.includes('show')) {
        return { status: 0, stdout: JSON.stringify(['backend', 'shared']) };
      }

      if (args.includes('run') && args.includes('backend-e2e:e2e')) {
        return { status: 0 };
      }

      return { status: 0 };
    });

    process.argv = [...process.argv, '--affected'];
    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_0');
    expect(spawnSync).toHaveBeenCalledTimes(2);
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('fails with status code if the nx runner fails', () => {
    spawnSync.mockReturnValue({ status: 2 }); // nx failed to run

    let caughtError = null;
    try {
      main();
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain('TEST_ABORT_EXIT_2');
    expect(exitMock).toHaveBeenCalledWith(2);
  });
});
