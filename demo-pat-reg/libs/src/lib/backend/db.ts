import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Prefer a single DATABASE_URL (used by E2E, CI service containers, etc.)
// Fall back to individual DB_* vars for local dev convenience.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.DEV_DATABASE_URL ||
  (() => {
    const user = process.env.DB_USER ?? 'postgres';
    const password = process.env.DB_PASSWORD ?? 'password';
    const host = process.env.DB_HOST ?? 'localhost';
    const port = process.env.DB_PORT ?? '5432';
    const name = process.env.DB_NAME ?? 'demo_pat_reg';
    return `postgres://${user}:${password}@${host}:${port}/${name}`;
  })();

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient);
