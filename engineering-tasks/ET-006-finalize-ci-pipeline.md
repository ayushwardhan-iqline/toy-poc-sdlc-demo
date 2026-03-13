# Engineering Task ET-006

**Linked User Stories:** IQ-002
**Status:** In Progress

## Description
Troubleshoot, fix, and finalize the CI pipeline orchestration to ensure all projects (apps and libs) pass linting, type checking, and unit/integration tests as defined in `INTENDED_CI_FLOW.md`. This includes resolving environment-specific issues, configuration gaps, and orchestration errors uncovered during feature development.

## Technical Implementation Details
- [x] Standardize test target names in `package.json` (infer from Nx plugins)
- [x] Add missing Vitest/Jest configurations for libraries and apps
- [x] Add explicit ESLint configurations to ensure coverage across apps and libs
- [x] Fix global ESLint ignore patterns for shadcn/ui and other generated code
- [x] Fix `tsconfig.spec.json` missing references in `libs` for proper test file linting
- [x] Fix `sonarjs/no-commented-code` and `security/detect-object-injection` lint errors
- [ ] Address Windows encoding issues in `scripts/run-semgrep.mjs` (Unicode support)
- [ ] Verify full CI suite passes locally via unified workspace scripts

## Definition of Done
- [x] `ci:full:static-analysis:eslint` passes for all 5 projects
- [x] `ci:full:test:unit` results in 0 failures across all projects
- [ ] `scripts/run-semgrep.mjs` executes without encoding crashes
- [ ] Workspace state matches `INTENDED_CI_FLOW.md` expectations
