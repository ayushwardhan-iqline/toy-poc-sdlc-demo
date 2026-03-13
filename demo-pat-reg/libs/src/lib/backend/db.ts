import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'password';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbName = process.env.DB_NAME || 'demo_pat_reg';

const queryClient = postgres(
  `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
);

export const db = drizzle(queryClient);
