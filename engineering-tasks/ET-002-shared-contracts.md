# Engineering Task ET-002

**Linked User Stories:** IQ-002
**Status:** Todo

## Description
Extract and define clean API contracts for the Visits feature to satisfy the "Contracts" layer of the Hexagonal Architecture. Currently, database schemas are leaking into the shared boundary.

## Technical Implementation Details
- [ ] Create `libs/shared/contracts/clinical.contracts.ts`
- [ ] Define `ListVisitsRequestSchema` using Zod for query parameters (search keyword, page number, page size).
- [ ] Define `ListVisitsResponseSchema` using Zod for the API response shape (paginated visits data).
- [ ] Ensure no Drizzle/SQL types are imported into this file; it must remain a pure API boundary.

## Definition of Done
- [ ] `clinical.contracts.ts` created with Zod schemas
- [ ] Schemas successfully exported and available to both frontend and backend
- [ ] Reviewed for architectural compliance (no DB leakage)
