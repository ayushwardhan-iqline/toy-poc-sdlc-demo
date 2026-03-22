import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './libs/src/lib/schemas/index.ts',
  out: './apps/backend/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL || 'postgres://postgres:password@localhost:5432/demo_pat_reg',
  },
});
