# E2E Testing Guide

This guide outlines the conventions and workflows for creating and maintaining End-to-End (E2E) tests in our Nx monorepo pipeline.

## 1. Traceability to Engineering Tasks

All E2E tests **must** trace back to a specific Engineering Task. This allows the CI pipeline to automatically verify that the implementation maps correctly to the required behaviors defined in the task.

### Tagging Convention
When writing Playwright tests, prefix the test title with the Engineering Task ID (e.g., `ET-22` or `ET-8`).

```typescript
// ✅ Good: Test is explicitly linked to ET-22
test('ET-22: Password reset API flow completes successfully', async ({ page }) => {
  // ...
});

// ❌ Bad: No traceability
test('should reset password', async ({ page }) => {
  // ...
});
```

If the Engineering Task belongs to a larger User Story, you can optionally include the User Story context internally, but the Engineering Task ID is required in the test description for the Step 8.5 AI Judge to correlate results.

## 2. AI-Assisted Test Scaffolding

To minimize developer overhead, we highly recommend using AI to scaffold E2E tests directly from Engineering Tasks.

We have a dedicated skill designed for this: **`playwright-cli`**.

### Workflow:
1. **Define the Engineering Task**: Ensure your `engineering-tasks/` markdown file contains clear Acceptance Criteria.
2. **Invoke the Skill**: You can ask an underlying AI agent (equipped with the `playwright-cli` skill) to read the task and interact with the local development server.
3. **Scaffold the Test**: The `playwright-cli` skill allows the agent to browse your local UI, perform the actions required by the Acceptance Criteria, and output the generated Playwright code.
4. **Review and Format**: Take the generated code, ensure it uses the `ET-XX:` tagging convention, and place it in the appropriate `apps/*-e2e/` project.

By using this flow, E2E tests become a byproduct of well-defined tasks rather than a manual chore.

## 3. Pipeline Integration (Step 8 & 8.5)

- **Step 8 (E2E Execution)**: Runs Playwright tests for *affected* applications only. It generates artifacts (HTML report, traces, videos on failure).
- **Step 8.5 (AI Judge)**: A headless OpenCode agent will review the test results, match them against the changed Engineering Tasks in the PR, and enforce a **PASS/FAIL** decision based on whether the E2E tests adequately cover the task's criteria. 

> **Note**: For Engineering Tasks that are exclusively backend refactoring or utility additions (where E2E testing makes no logical sense), the AI Judge is instructed to auto-pass this gate.
