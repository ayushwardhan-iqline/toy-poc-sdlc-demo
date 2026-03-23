import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// In CI, DATABASE_URL is injected by the GitHub Actions service container.
// Locally we always use an isolated test database — we deliberately do NOT fall
// back to process.env.DATABASE_URL here because the workspace .env sets it to
// the dev database (demo_pat_reg), and we must never run tests against that.
const resolvedTestDbUrl = process.env.CI
  ? process.env.DATABASE_URL?.trim()
  : process.env.E2E_DB_URL?.trim();

export function getTestDbUrl() {
  if (!resolvedTestDbUrl) {
    throw new Error(
      process.env.CI
        ? 'E2E test database is not configured. Set DATABASE_URL for the Playwright E2E step in CI.'
        : 'E2E test database is not configured. Set E2E_DB_URL before running Playwright locally.'
    );
  }

  return resolvedTestDbUrl;
}

// Use dedicated ports for E2E so tests never collide with a running dev server
// (dev uses 3000/4200; E2E uses 3001/4201). Override via env vars if needed.
const backendBaseUrl = process.env.BACKEND_BASE_URL ?? 'http://127.0.0.1:3001';
const apiBaseUrl = process.env.VITE_API_URL ?? `${backendBaseUrl}/api`;
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:4201';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  outputDir: 'test-output/playwright/output',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-output/playwright/report', open: 'never' }],
  ],

  // Runs once before the entire test suite: creates the DB and pushes the schema.
  globalSetup: require.resolve('./src/global-setup.ts'),

  use: {
    baseURL,
    trace: process.env.PW_ALL_ASSETS ? 'on' : 'retain-on-failure',
    video: process.env.PW_ALL_ASSETS ? 'on' : 'retain-on-failure',
    screenshot: process.env.PW_ALL_ASSETS ? 'on' : 'only-on-failure',

    // Enable slow-mo via environment variable for easier CLI debugging (e.g. SLOWMO=1000)
    launchOptions: {
      slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    },
  },

  webServer: [
    {
      // Build via Nx (cached) then run the output directly. This avoids Nx's
      // process dedup which blocks when a dev server is already running.
      command:
        'bun nx run @demo-pat-reg/backend:build:production && node apps/backend/dist/main.mjs',
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: false,
      cwd: workspaceRoot,
      stdout: 'pipe',
      env: {
        ...(process.env as Record<string, string>),
        DATABASE_URL: resolvedTestDbUrl ?? '',
        HOST: '127.0.0.1',
        PORT: '3001',
      },
    },
    {
      command: 'bun nx run @demo-pat-reg/frontend:preview',
      url: 'http://127.0.0.1:4201',
      reuseExistingServer: false,
      cwd: workspaceRoot,
      stdout: 'pipe',
      env: {
        ...(process.env as Record<string, string>),
        HOST: '127.0.0.1',
        PORT: '4201',
        VITE_API_URL: apiBaseUrl,
      },
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
