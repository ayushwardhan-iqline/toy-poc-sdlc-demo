# Engineering Task ET-008

**Linked User Stories:** IQ-002
**Status:** Done

## Description
Establish the `backend/core/` layer as described in the Architecture Guidelines. This covers: centralized error handling (no per-handler try-catch), ergonomic HTTP error factories, and an `asyncHandler` HOF so handlers are pure translators with zero boilerplate.

## Technical Implementation Details

### Error Infrastructure
- [x] Create `libs/src/lib/backend/core/app-error.ts`
  - `AppError extends Error` with `statusCode: number` constructor param
- [x] Create `libs/src/lib/backend/core/error-handler.middleware.ts` + spec
  - `globalErrorHandler(err, req, res, next)` — ZodError→400, AppError→statusCode, unknown→500
  - This is the **only** place `console.error` lives for unexpected errors

### HTTP Error Factories
- [x] Create `libs/src/lib/backend/core/http-errors.ts` + spec
  - Named factories: `httpErrors.notFound()`, `.forbidden()`, `.conflict()`, etc.
  - Use-sites read like prose: `throw httpErrors.notFound('Visit not found')`

### Async Handler Wrapper
- [x] Create `libs/src/lib/backend/core/async-handler.ts` + spec
  - HOF that wraps async handlers: `asyncHandler(async (req, res) => { ... })`
  - Catches all errors and forwards to `next` automatically — no try-catch in handlers
- [x] Update `libs/src/lib/feature-clinical/http-handlers/visit.handlers.ts`
  - Wrapped with `asyncHandler` — now a clean 3-line business translator
- [x] Update `libs/src/lib/feature-clinical/http-handlers/visit.handlers.spec.ts`

### Wiring
- [x] Export all `backend/core` utilities from the `libs` index barrel
- [x] Mount `globalErrorHandler` as the last middleware in `apps/backend/src/main.ts`

## Definition of Done
- [x] `backend/core/` exists with all utilities and full unit test coverage
- [x] `visit.handlers.ts` is a 3-line pure translator — no try-catch, no error formatting
- [x] All 26 unit tests pass (6 test files)
- [x] No lint errors
