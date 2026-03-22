import { execSync } from 'child_process';
import { workspaceRoot } from '@nx/devkit';
import postgres from 'postgres';
import { testDbUrl } from '../playwright.config';

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
  const dbUrl = testDbUrl;

  // Derive the admin connection string by targeting the postgres system DB
  // so we can issue a CREATE DATABASE statement if needed.
  const adminUrl = dbUrl.replace(/\/[^/]+$/, '/postgres');
  const sql = postgres(adminUrl, { max: 1 });

  try {
    // Extract the database name from the URL (last path segment)
    const dbName = new URL(dbUrl).pathname.slice(1);

    const rows = await sql`
      SELECT 1 FROM pg_database WHERE datname = ${dbName}
    `;

    if (rows.length === 0) {
      // CREATE DATABASE cannot be parameterised — dbName comes from our own
      // config constant, so there is no SQL injection risk here.
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
