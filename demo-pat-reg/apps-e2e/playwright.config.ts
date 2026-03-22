import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

// In CI, DATABASE_URL is injected by the GitHub Actions service container.
// Locally we always use an isolated test database — we deliberately do NOT fall
// back to process.env.DATABASE_URL here because the workspace .env sets it to
// the dev database (demo_pat_reg), and we must never run tests against that.
export const testDbUrl = process.env.CI
  ? (process.env.DATABASE_URL as string)
  : (process.env.E2E_DB_URL as string);

const baseURL = process.env.BASE_URL ?? 'http://localhost:4200';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),

  // Runs once before the entire test suite: creates the DB and pushes the schema.
  globalSetup: require.resolve('./src/global-setup.ts'),

  use: {
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',

    // Enable slow-mo via environment variable for easier CLI debugging (e.g. SLOWMO=1000)
    launchOptions: {
      slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    },
  },

  webServer: [
    {
      // Pass DATABASE_URL explicitly so the backend process targets the test DB.
      // This is the proper way to inject env into a Playwright webServer process.
      command: 'bun nx run @demo-pat-reg/backend:serve',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      stdout: 'pipe',
      env: {
        ...(process.env as Record<string, string>),
        DATABASE_URL: testDbUrl,
      },
    },
    {
      command: 'bun nx run @demo-pat-reg/frontend:preview',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      stdout: 'pipe',
    },
  ],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
