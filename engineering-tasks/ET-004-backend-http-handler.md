# Engineering Task ET-004

**Linked User Stories:** IQ-002
**Status:** Todo

## Description
Implement the HTTP translator layer for listing visits and wire it into the main Express monolith. This ensures express `req`/`res` concerns don't bleed into business logic.

## Technical Implementation Details
- [ ] Create `libs/feature-clinical/http-handlers/visit.handlers.ts`
- [ ] Write `handleListVisits` Express middleware that parses `req.query` using `ListVisitsRequestSchema`, calls `listRecentVisits` use case, and replies with standard API JSON.
- [ ] Refactor `apps/backend/src/main.ts` to replace the `/api/visits` generic GET route with the new `handleListVisits` handler.

## Definition of Done
- [ ] HTTP handler translates Express models to Zod DTOs seamlessly
- [ ] `main.ts` successfully delegates route to the new handler
- [ ] Backend API manually or integration tested for success and error validation
