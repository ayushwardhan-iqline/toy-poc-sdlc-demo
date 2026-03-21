# Engineering Task ET-003

**Linked User Stories:** IQ-002
**Status:** Done

## Description
Implement the backend vertical slice for listing visits. This separates the database interactions (Data Access) from the business rules / coordination logic (Use Cases), moving away from the monolithic Express route.

## Technical Implementation Details
- [x] Create `libs/feature-clinical/data-access/visit.repo.ts`
- [x] Implement `listVisits(filters, pagination)` procedural function in the repo using Drizzle ORM to fetch from the `visits` table.
- [x] Create `libs/feature-clinical/use-cases/list-recent-visits.ts`
- [x] Implement pure procedural business logic in the use case to validate input parameters via the explicit contract and invoke the repository function.

## Definition of Done
- [x] Data access function handles SQL/Drizzle correctly with filtering and pagination
- [x] Use case acts as the rulebook, orchestrating without HTTP or DB logic
- [x] Unit tests pass for the use case locally
