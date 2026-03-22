import { test as base } from '@playwright/test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getTestDbUrl } from '../../playwright.config';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture Types
// ─────────────────────────────────────────────────────────────────────────────
export type DrizzleDb = ReturnType<typeof drizzle>;

export type AppFixtures = {
  /** Direct Drizzle ORM access so individual tests can INSERT / SELECT / DELETE
   *  their own isolated rows without touching a global seed. */
  db: DrizzleDb;
  /** An authenticated browser context – auth token is injected before any page
   *  load so tests never have to click through the login UI. */
  authenticatedUser: { id: string; role: string; token: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// Extended Playwright test with custom fixtures
// ─────────────────────────────────────────────────────────────────────────────
export const test = base.extend<AppFixtures>({
  // Provides raw Drizzle access for test-level seeding / teardown.
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    const queryClient = postgres(getTestDbUrl());
    const dbInstance = drizzle(queryClient);
    await use(dbInstance);
    // No per-test cleanup here by design – tests should use explicit WHERE
    // clauses against the ids they create so they stay hermetic.
    await queryClient.end();
  },

  // Injects a valid auth token before any navigation happens.
  authenticatedUser: async ({ page }, use) => {
    const user = { id: 'test-user-1', role: 'admin', token: 'mock-jwt-token' };

    // addInitScript runs *before* the page scripts, so the token is always
    // available when the application bootstraps.
    await page.context().addInitScript((token) => {
      localStorage.setItem('auth_token', token);
    }, user.token);

    await use(user);
  },
});

// Re-export so tests only ever need to import from this one file.
export { expect } from '@playwright/test';
