# Nx Monorepo CI Pipeline (Local-First, No External SaaS)

This document describes a **deterministic CI pipeline** designed for an **Nx monorepo** that:

* Runs **entirely via CLI tools**
* Works **locally and in GitHub Actions**
* Avoids external SaaS dependencies (e.g. Nx Cloud, SonarCloud)
* Is reproducible in **local GitHub runners**
* Uses **Nx only for orchestration**, not remote services

The pipeline emphasizes **fail-fast checks**, **developer ergonomics**, and **simple reasoning about CI state**.

---

# Pipeline Overview

```
PR opened
   ↓
Base branch sync check
   ↓
Static analysis
   - ESLint
   - Complexity rules
   - Security linting
   - Semgrep
   ↓
Typecheck
   ↓
Unit tests (Jest)
   ↓
Coverage gate (Jest)
   ↓
Integration tests (Jest)
   ↓
AI code review (architecture + quality + arbiter via OpenCode run)
   ↓
E2E tests (affected only)
   ↓
AI Judging output of E2E tests
```

The order is chosen so that **fast deterministic checks fail first**, preventing expensive tests from running unnecessarily.

---

# Step 1 — Base Branch Sync Check

### Purpose

Ensure the PR branch is **fully up to date with the base branch** (e.g. `main`).

This prevents merge edge cases such as:

* stale dependency graphs
* outdated test results
* CI passing on an obsolete base commit

If the base branch has commits not present in the PR branch, the CI fails and the developer must rebase or merge.

### Script

```
git fetch origin main

BASE=$(git merge-base HEAD origin/main)

if [ "$BASE" != "$(git rev-parse origin/main)" ]; then
  echo "Branch is not up to date with main. Please rebase or merge."
  exit 1
fi
```

This ensures:

```
PR branch contains latest base branch commits
```

before any CI checks run.

---

# Step 2 — Static Analysis

Static analysis is designed to catch **structural problems before tests run**.

## ESLint

Primary linting tool.

Plugins used:

* `@typescript-eslint`
* `eslint-plugin-sonarjs`
* `eslint-plugin-security`

### Purpose

Catches:

* syntax issues
* dangerous patterns
* maintainability problems
* cognitive complexity
* unsafe constructs

### Complexity Rules

Handled via ESLint rules:

```
complexity
sonarjs/cognitive-complexity
```

These detect:

* overly complex functions
* hard-to-maintain logic
* nested control flow

---

## Semgrep

Security-oriented static analysis.

Purpose:

Detects patterns such as:

* unsafe eval usage
* injection patterns
* insecure API usage
* dangerous libraries

Runs as a CLI scan:

```
semgrep --config auto
```

No server required.

---

# Step 3 — Type Checking

TypeScript type checking runs independently of linting.

Command:

```
tsc --noEmit
```

Purpose:

* ensures strict type safety
* catches runtime errors early
* validates cross-package type boundaries in the monorepo

Type errors fail the CI immediately.

---

# Step 4 — Unit Tests

Framework: **Jest**

Purpose:

* test individual functions and modules
* ensure business logic correctness
* run quickly and deterministically

Command:

```
jest
```

Nx can orchestrate this via:

```
nx affected -t test
```

This ensures **only projects affected by the PR run tests**.

---

# Step 5 — Coverage Gate

Coverage is produced automatically during unit tests.

Command:

```
jest --coverage
```

Coverage thresholds are defined in configuration:

```
coverageThreshold:
  global:
    branches: 80
    functions: 80
    lines: 80
    statements: 80
```

If coverage drops below thresholds, CI fails.

Purpose:

* prevent silent loss of test coverage
* ensure new code remains tested

---

# Step 6 — Integration Tests

Integration tests verify **interactions between modules and services**.

Examples:

* database + API
* service orchestration
* repository + business logic

These tests are slower than unit tests but still deterministic.

Often run via a separate Jest config:

```
jest --config jest.integration.config.ts
```

Typical structure:

```
tests/
  unit/
  integration/
```

---

# Step 7 — AI Code Review (OpenCode Headless)

Step 7 is implemented as a **3-agent headless review stage** using `opencode run`:

* Architecture Review agent
* Code Quality Review agent
* Arbiter agent

Important implementation notes:

* We do **not** use `opencode --file workflow.yaml --non-interactive` orchestration.
* OpenCode orchestration is handled by repository scripts for deterministic CI behavior.
* Step 7 runs dedicated OpenCode agents from:
  * `demo-pat-reg/.opencode/agents/step7-architecture-review.md`
  * `demo-pat-reg/.opencode/agents/step7-code-quality-review.md`
  * `demo-pat-reg/.opencode/agents/step7-arbiter-review.md`
* Architecture agent loads `code-review-flow` skill; code-quality agent loads `code-review-expert` skill.
* Model selection is environment-driven via `OPENCODE_MODEL` (passed to `--model`).

Context is collected into:

```
demo-pat-reg/reports/ai-context/
```

Primary files:

* `pr.diff`
* `changed_files.txt`
* `nx-depgraph.json` (best effort)

Outputs:

```
demo-pat-reg/reports/architecture-review.md
demo-pat-reg/reports/code-quality-review.md
demo-pat-reg/reports/final-review.md
```

Commands:

```
bun run ci:affected:ai:review
bun run ci:full:ai:review
```

CI gate behavior:

* Arbiter report must contain `CI_DECISION: PASS|FAIL`
* CI fails when arbiter emits `CI_DECISION: FAIL`
* CI also fails when blocker severities (`CRITICAL` / `BLOCKER`) are detected in the arbiter report

---

# Step 8 — End-to-End Tests

Framework: **Playwright**

Purpose:

* verify full application workflows
* simulate real user behaviour
* ensure system-level correctness

To avoid slow CI pipelines, only **affected applications** run E2E tests.

Command:

```
nx affected -t e2e
```

Benefits:

* prevents unrelated code from triggering E2E tests
* drastically reduces CI runtime

---

# Step 8.5 (or 9) - Judging output of End-to-End Tests

Automated code-review agent judges the output of end-to-end tests and how much of the user-stories are met by this

# Nx Integration

Nx is used strictly for:

* task orchestration
* dependency graph analysis
* affected project detection
* parallel task execution

Example CI command:

```
nx affected -t lint,test,integration
```

Optional:

```
nx affected -t e2e
```

Nx runs tasks only for projects impacted by the PR.

---

# GitHub Actions Example

```
name: CI

on:
  pull_request:

jobs:
  checks:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - run: bun install

      - name: Ensure branch is up to date
        run: |
          git fetch origin main
          BASE=$(git merge-base HEAD origin/main)
          if [ "$BASE" != "$(git rev-parse origin/main)" ]; then
            echo "Branch must be rebased on main"
            exit 1
          fi

      - run: npx nx affected -t lint
      - run: npx nx affected -t test
      - run: npx nx affected -t integration
```

---

# Design Principles

## 1. Fail Fast

Fast checks run before expensive ones.

Order:

```
lint → typecheck → unit tests → integration → e2e
```

---

## 2. Deterministic CI

All steps:

* CLI-based
* reproducible locally
* no external services required

---

## 3. Local Parity

Developers can run the **exact same checks locally** as CI:

```
nx affected -t lint,test,integration
```

---

## 4. Minimal External Dependencies

No reliance on:

* hosted analysis platforms
* remote cache services
* external CI tooling

This simplifies debugging and maintenance.

---

# Tooling Summary

| Purpose                  | Tool                   |
| ------------------------ | ---------------------- |
| Linting                  | ESLint                 |
| Complexity analysis      | eslint-plugin-sonarjs  |
| Security linting         | eslint-plugin-security |
| Static security scanning | Semgrep                |
| Type checking            | TypeScript             |
| Unit tests               | Jest                   |
| Coverage                 | Jest                   |
| Integration tests        | Jest                   |
| E2E tests                | Playwright             |
| Monorepo orchestration   | Nx                     |

---

# Key Advantages

* Deterministic CI
* Local reproducibility
* Fast incremental builds
* Simple operational model
* Minimal infrastructure requirements
