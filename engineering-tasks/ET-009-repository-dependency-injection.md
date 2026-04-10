# Engineering Task ET-009

**Linked User Stories:** IQ-002
**Status:** Done

## Description
Repository functions currently import the Drizzle `db` singleton at module level, which couples data-access directly to the Postgres driver. This blocks two future capabilities: (1) swapping the data-access layer for a frontend database (IndexedDB/SQLite) without any use-case changes, and (2) writing clean unit tests without module-level mocking of the db. This task refactors `visit.repo.ts` to accept `db` as an explicit parameter (Dependency Injection), threads it through the use-case, and injects the concrete Postgres `db` instance at the handler (outermost application) layer.

## Technical Implementation Details
- [x] In `libs/src/lib/feature-clinical/data-access/visit.repo.ts`:
  - Define and export a `VisitRepoDb` type representing the minimal db interface needed (using `typeof db` or a structural subset)
  - Change `listVisits(searchOptions)` to `listVisits(db: VisitRepoDb, searchOptions)`
  - Remove the top-level `import { db } from '../../backend/db.js'`
- [x] In `libs/src/lib/feature-clinical/data-access/visit.repo.spec.ts`:
  - Remove `vi.mock('../../backend/db.js', ...)` entirely
  - Construct a minimal mock db object (`{ select: vi.fn() }`) and pass it as the first argument to `listVisits(mockDb, ...)`
  - All existing assertions remain valid
- [x] In `libs/src/lib/feature-clinical/use-cases/list-recent-visits.ts`:
  - Accept a `db: VisitRepoDb` parameter as the first argument
  - Pass `db` through to `VisitRepo.listVisits(db, ...)`
  - The use-case still has zero DB imports — it receives an opaque value it passes onwards
- [x] In `libs/src/lib/feature-clinical/use-cases/list-recent-visits.spec.ts`:
  - Add a dummy `db` arg (e.g. `undefined as any`) when calling `listRecentVisits`
  - `VisitRepo.listVisits` is still mocked at module level so the actual value of `db` is irrelevant to assertions
- [x] In `libs/src/lib/feature-clinical/http-handlers/visit.handlers.ts`:
  - Import the real `db` from `../../backend/db.js` — the handler is the correct injection point (outermost layer)
  - Pass `db` as the first argument to `listRecentVisits(db, validatedQuery)`
  - Handler spec uses a module mock for the use-case, so no spec changes needed here

## Definition of Done
- [x] `visit.repo.ts` accepts `db` as a parameter; no module-level db import
- [x] `list-recent-visits.ts` accepts `db` as a parameter; no module-level db import
- [x] The concrete Drizzle `db` is injected only at the handler level in `visit.handlers.ts`
- [x] `visit.repo.spec.ts` tests pass `db` directly (no module mock needed)
- [x] All unit tests pass (`npx nx run @demo-pat-reg/shared:test`)
- [x] No lint or type-check errors (`npx nx run @demo-pat-reg/shared:lint`)
- [x] The architecture is now offline-ready: swapping the `db` arg to an IndexedDB adapter in the handler would require zero changes to repo or use-case files
