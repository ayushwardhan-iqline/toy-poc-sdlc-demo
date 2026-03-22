# Engineering Task ET-005

**Linked User Stories:** IQ-002
**Status:** Done

## Description
Develop the frontend table component to display paginated and searchable visits on the dashboard, consuming the newly defined API contracts.

## Technical Implementation Details
- [x] Create a new React component at `apps/frontend/src/components/visits/VisitsDataTable.tsx` (or similar appropriate path).
- [x] Implement a search input bar and pagination controls (Next/Prev, page numbers).
- [x] Integrate API fetching using the new `ListVisitsResponseSchema` to ensure type-safe data loads based on state changes (search term, page).
- [x] Update `apps/frontend/src/app/app.tsx` to replace the monolithic loading grid with this dedicated component.

## Definition of Done
- [x] React component renders a table successfully
- [x] Search functionality filters the backend API correctly
- [x] Pagination controls fetch the next/previous segments correctly
- [x] Verified in local environment UI
