# Engineering Task ET-006 [CHORE]

**Type:** Infrastructure / DevOps Chore
**Status:** Done

## Description

Establish a production-grade, unified CI/CD pipeline for the entire monorepo. This is a foundational infrastructure chore that enables the entire team's velocity. The pipeline must orchestrate linting, type checking, unit/integration tests, security scanning, and AI-assisted code review across all projects (apps and libs) in a consistent, maintainable manner.

This undertaking involves significant architectural decisions around:
- Test runner standardization (migrating from Jest to Vitest for ESM compatibility)
- Module system alignment (full ESM adoption across the monorepo)
- Security scanning integration (Semgrep via uv)
- AI-powered review automation (OpenCode CLI integration)
- GitHub Actions workflow optimization
- Cross-platform compatibility (Windows local dev → Linux CI)

## Technical Implementation Details

### Phase 1: ESM Standardization & Test Runner Migration
- [x] Add `"type": "module"` to root `package.json` for native ESM support
- [x] Remove Jest dependencies (`jest`, `@nx/jest`, `@swc/jest`, `ts-jest`, `@types/jest`)
- [x] Create `apps/backend/vitest.config.ts` with proper coverage settings
- [x] Create `apps/backend-e2e/vitest.config.ts` with global setup/teardown
- [x] Migrate `apps/backend-e2e` from Jest to Vitest (ESM exports, setup files)
- [x] Update `tsconfig.spec.json` files to use `"vitest/globals"` types
- [x] Delete Jest configuration files (`jest.config.cts`, `.spec.swcrc`, `jest.preset.js`)
- [x] Remove `@nx/jest/plugin` from `nx.json`

### Phase 2: Security Scanning & Static Analysis
- [x] Create `scripts/run-semgrep.mjs` for security scanning via uv/uvx
- [x] Implement affected-mode scanning (git diff → file list → semgrep)
- [x] Add encoding fixes for cross-platform compatibility (UTF-8 enforcement)
- [x] Configure `sonarjs/no-os-command-from-path` rule handling
- [x] Ensure semgrep passes on its own scripts (self-hosting security)

### Phase 3: AI Review Automation Scripts
- [x] Create `scripts/collect-ai-context.mjs` (PR diff, changed files, Nx graph)
- [x] Create `scripts/run-ai-review-step7.mjs` (architecture + quality review)
- [x] Create `scripts/run-ai-e2e-judge.mjs` (Playwright report evaluation)
- [x] Implement context collection with git range resolution (NX_BASE/NX_HEAD)
- [x] Add agent orchestration for OpenCode CLI with proper attachments

### Phase 4: GitHub Actions Workflow
- [x] Configure `ubuntu-latest` runner with `working-directory: demo-pat-reg`
- [x] Set up Bun runtime (`oven-sh/setup-bun@v1`)
- [x] Set up uv for Python tooling (`astral-sh/setup-uv@v5`)
- [x] Install OpenCode CLI globally
- [x] Configure 10-step pipeline: base-sync → static-analysis → typecheck → unit → coverage → integration → AI review → E2E → AI judge
- [x] Add conditional AI E2E Judge step (only when Playwright reports exist)
- [x] Add artifact upload for Playwright reports

### Phase 5: Cross-Platform Compatibility
- [x] Handle Windows PowerShell/Bash command differences in scripts
- [x] Ensure all scripts work locally (Windows) and in CI (Linux)
- [x] Fix terminal encoding issues for semgrep output
- [x] Validate script test suite passes on both platforms

### Phase 6: Verification & Documentation
- [x] Verify full CI suite passes locally via `ci:affected:all`
- [x] Verify full CI suite passes in GitHub Actions
- [x] Document any environment-specific setup requirements
- [x] Update `INTENDED_CI_FLOW.md` if deviations were necessary

### Phase 7: Ergonomic Improvements (AI Context & Triggers)
- [x] Refactor `collect-ai-context.mjs` to parse explicitly linked ET/IQ tasks from PR body/comments.
- [x] Ensure CI fails explicitly if no task/story references can be found.
- [x] Remove automatic AI steps from `ci.yml`.
- [x] Implement `ai-review.yml` triggered via `issue_comment` (`/review`).
- [x] Configure AI review GitHub action to post "pending" / "success" / "failure" commit statuses to block unreviewed PRs from merging.

## Scope & Complexity Assessment

**Estimated Effort:** 2-3 engineering days (significantly more than typical feature tasks)

**Complexity Factors:**
1. **Multi-platform testing**: Local Windows dev vs Linux CI requires careful path/command handling
2. **Toolchain diversity**: Bun + Node + uv + Python (semgrep) + OpenCode CLI all need to coexist
3. **Test runner migration**: Jest → Vitest affects 4 projects with different setup patterns
4. **Security scanning self-hosting**: Scripts must pass their own security checks
5. **AI integration**: External API dependencies, context size limits, token management
6. **Nx plugin orchestration**: Multiple plugins (`@nx/vite`, `@nx/eslint`, `@nx/playwright`) must be configured to work together

**Risk Areas:**
- Semgrep Python environment on Windows
- OpenCode API key management in CI
- Playwright browser downloads in GitHub Actions
- ESM/CJS interoperability during transition period

## Definition of Done

- [x] All 30 script tests pass (`bun run test:scripts`)
- [x] ESLint passes for all projects (`ci:full:static-analysis:eslint`)
- [x] Semgrep security scan passes (`ci:full:static-analysis:semgrep`)
- [x] Type checking passes (`ci:full:typecheck`)
- [x] Unit tests pass (`ci:full:test:unit`)
- [x] Coverage gates pass (`ci:full:test:coverage`)
- [x] Jest completely removed from the monorepo
- [x] GitHub Actions workflow runs without manual intervention
- [x] Full CI pipeline completes in under 10 minutes for affected projects
- [x] Documentation updated with any deviations from `INTENDED_CI_FLOW.md`
