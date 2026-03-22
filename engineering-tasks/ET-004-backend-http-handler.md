# Engineering Task ET-004

**Status:** Done

## Description
Implement the HTTP translator layer for listing visits and wire it into the main Express monolith. This ensures express `req`/`res` concerns don't bleed into business logic.

## Technical Implementation Details
- [x] Create `libs/feature-clinical/http-handlers/visit.handlers.ts`
- [x] Write `handleListVisits` Express middleware that parses `req.query` using `ListVisitsRequestSchema`, calls `listRecentVisits` use case, and replies with standard API JSON.
- [x] Refactor `apps/backend/src/main.ts` to replace the `/api/visits` generic GET route with the new `handleListVisits` handler.

## Definition of Done
- [x] HTTP handler translates Express models to Zod DTOs seamlessly
- [x] `main.ts` successfully delegates route to the new handler
- [x] Backend API manually or integration tested for success and error validation
