# Engineering Task ET-002

**Linked User Stories:** IQ-002
**Status:** Done

## Description
Extract and define clean API contracts for the Visits feature to satisfy the "Contracts" layer of the Hexagonal Architecture. Currently, database schemas are leaking into the shared boundary.

## Technical Implementation Details
- [x] Create `libs/shared/contracts/clinical.contracts.ts`
- [x] Define `ListVisitsRequestSchema` using Zod for query parameters (search keyword, page number, page size).
- [x] Define `ListVisitsResponseSchema` using Zod for the API response shape (paginated visits data).
- [x] Ensure no Drizzle/SQL types are imported into this file; it must remain a pure API boundary.

## Definition of Done
- [x] `clinical.contracts.ts` created with Zod schemas
- [x] Schemas successfully exported and available to both frontend and backend
- [x] Reviewed for architectural compliance (no DB leakage)
