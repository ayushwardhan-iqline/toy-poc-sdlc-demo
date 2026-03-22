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
    await queryClient.end();
  },
});

// Re-export so tests only ever need to import from this one file.
export { expect } from '@playwright/test';
