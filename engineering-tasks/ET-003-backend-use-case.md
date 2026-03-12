# Engineering Task ET-003

**Linked User Stories:** IQ-002
**Status:** Todo

## Description
Implement the backend vertical slice for listing visits. This separates the database interactions (Data Access) from the business rules / coordination logic (Use Cases), moving away from the monolithic Express route.

## Technical Implementation Details
- [ ] Create `libs/feature-clinical/data-access/visit.repo.ts`
- [ ] Implement `listVisits(filters, pagination)` procedural function in the repo using Drizzle ORM to fetch from the `visits` table.
- [ ] Create `libs/feature-clinical/use-cases/list-recent-visits.ts`
- [ ] Implement pure procedural business logic in the use case to validate input parameters via the explicit contract and invoke the repository function.

## Definition of Done
- [ ] Data access function handles SQL/Drizzle correctly with filtering and pagination
- [ ] Use case acts as the rulebook, orchestrating without HTTP or DB logic
- [ ] Unit tests pass for the use case locally
