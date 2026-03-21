# Engineering Task ET-007

**Linked User Stories:** IQ-002
**Status:** Done

## Description
Establish a robust dual-layer database seeding strategy using Drizzle ORM and `@ngneat/falso` for reliable local development and idempotent E2E testing environments.

## Technical Implementation Details
- [x] Install `@ngneat/falso` for rich mock data generation.
- [x] Create a global `apps/backend/src/db/seed.ts` script for populating the local dev database with deterministic mock patients and visits.
- [x] Add a `"db:seed"` command to the root `package.json`.
- [x] Connect the `apps-e2e` Playwright `db` fixture directly to the backend database schema to allow localized, test-specific data setup natively using Drizzle.
- [x] Implement a test-specific mock using Falso in an E2E spec bridging the frontend and backend architectures securely.

## Definition of Done
- [x] `db:seed` runs successfully locally.
- [x] Local environment features realistic fake data.
- [x] E2E test scripts can programmatically interact with the database via custom isolated fixtures without cross-contamination.
