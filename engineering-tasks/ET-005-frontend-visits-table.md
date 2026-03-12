# Engineering Task ET-005

**Linked User Stories:** IQ-002
**Status:** Todo

## Description
Develop the frontend table component to display paginated and searchable visits on the dashboard, consuming the newly defined API contracts.

## Technical Implementation Details
- [ ] Create a new React component at `apps/frontend/src/components/visits/VisitsDataTable.tsx` (or similar appropriate path).
- [ ] Implement a search input bar and pagination controls (Next/Prev, page numbers).
- [ ] Integrate API fetching using the new `ListVisitsResponseSchema` to ensure type-safe data loads based on state changes (search term, page).
- [ ] Update `apps/frontend/src/app/app.tsx` to replace the monolithic loading grid with this dedicated component.

## Definition of Done
- [ ] React component renders a table successfully
- [ ] Search functionality filters the backend API correctly
- [ ] Pagination controls fetch the next/previous segments correctly
- [ ] Verified in local environment UI
