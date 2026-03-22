import { execSync } from 'child_process';
import { workspaceRoot } from '@nx/devkit';
import postgres from 'postgres';
import { getTestDbUrl } from '../playwright.config';

/** E2E may only auto-create databases on this allowlist (CI + local conventions). */
const ALLOWED_E2E_DB_NAMES = new Set(['hims', 'demo_pat_reg_test']);

function assertSafePgIdentifier(name: string): void {
  if (!/^\w+$/.test(name)) {
    throw new Error(
      `Refusing to use database name "${name}": only alphanumeric and underscore are permitted.`
    );
  }
}

/**
 * Playwright Global Setup — runs once before the entire test suite.
 *
 * Responsibilities:
 *   1. Create the isolated test database if it doesn't already exist.
 *   2. Push the latest Drizzle schema to it (idempotent, safe to re-run).
 *
 * By doing this here — not in CI YAML — the test suite is fully self-contained:
 * the schema is always in sync and any developer can run `bunx playwright test`
 * without any manual database prep.
 */
export default async function globalSetup(): Promise<void> {
  const dbUrl = getTestDbUrl();

  // Derive the admin connection string by targeting the postgres system DB
  // so we can issue a CREATE DATABASE statement if needed.
  const adminUrl = dbUrl.replace(/\/[^/]+$/, '/postgres');
  const sql = postgres(adminUrl, { max: 1 });

  try {
    // Extract the database name from the URL (last path segment). The value
    // comes from CI/local env; validate before any dynamic SQL.
    const dbName = new URL(dbUrl).pathname.slice(1);
    assertSafePgIdentifier(dbName);
    if (!ALLOWED_E2E_DB_NAMES.has(dbName)) {
      throw new Error(
        `E2E database name "${dbName}" is not allowlisted. Add it to ALLOWED_E2E_DB_NAMES in global-setup.ts if this is an intentional test database.`
      );
    }

    const rows = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

    if (rows.length === 0) {
      // CREATE DATABASE cannot be parameterised; dbName is allowlisted above.
      await sql.unsafe(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await sql.end();
  }

  // Forward the full process.env so bun/drizzle-kit can resolve their binaries
  // (PATH, USERPROFILE, etc.), then override DATABASE_URL to target the test DB.
  // The Semgrep security/detect-object-injection rule is a false positive here:
  // we are not doing property access with user input, we're inheriting a known env.
  // nosemgrep: detect-object-injection
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  execSync('bun run db:push', {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
}
