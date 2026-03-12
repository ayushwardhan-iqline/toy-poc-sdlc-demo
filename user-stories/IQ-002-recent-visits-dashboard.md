# User Story IQ-002

**Date:** 2026-03-13
**Key:** IQ-002
**Summary:** Display a list of recent patient visits on the default dashboard tab

## Use Case
- **As a** Front Office Coordinator
- **I want to** view a searchable and paginated table of recent patient visits within the "Visits" section of the home dashboard
- **so that** I have immediate visibility into active cases and can quickly locate specific patients without navigating to a separate page.

## Acceptance Criteria
- **Scenario:** Viewing populated recent visits as a data table
- **Given:** I am on the default Dashboard (Home) page
- **and Given:** The system has recorded patient visits
- **When:** I view the "Visits" section
- **Then:** I see a data table displaying the most recent visits
- **and Then:** The table includes columns for: Patient Name, Visit Date, Visit Reason, and Visit Status
- **and Then:** The table is ordered chronologically by the most recent visit first

- **Scenario:** Searching for a specific visit
- **Given:** I am viewing the Visits data table
- **When:** I enter text into the search bar (e.g., Patient Name or Visit Reason)
- **Then:** The table instantly filters to show only visits matching the search term

- **Scenario:** Paginating through a large number of visits
- **Given:** There are more than 10 visit records
- **When:** I view the Visits data table
- **Then:** I see exactly 10 visits on the current page
- **and Then:** I see pagination controls (Next/Previous, Page Numbers) below the table
- **When:** I click the "Next" page button
- **Then:** The table updates to display the subsequent set of 10 visits

- **Scenario:** Viewing the visits section when no records exist (Empty State)
- **Given:** I am on the default Dashboard (Home) page
- **and Given:** No visits have been recorded yet
- **When:** I view the "Visits" section
- **Then:** I see an empty state message (e.g., "No recent visits found") instead of the table

---
*Generated using the `user-story` skill guidelines.*
