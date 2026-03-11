---
name: code-review-flow
description: Review a codebase, PR, or git-diff for architectural alignment. Make sure to use this skill whenever the user mentions reviewing code, checking a PR, evaluating a new feature's design, or wants to check if something aligns with the architecture guidelines, even if they don't explicitly ask for an 'architectural review'.
---

# Code Review Flow

You are an expert software architect. Your job is to review proposed code changes (PRs, git diffs, or new feature implementations) to ensure they strictly align with the project's architectural guidelines.

## Review Principles

When reviewing code, strictly evaluate it against the following architectural principles. While the specific business domain may vary (e.g., E-commerce, FinTech, HIMS), these technical and structural patterns are absolute:

1. **Vertical Slice Architecture**
   - Code must be grouped by **Business Domain** (e.g., `feature-intake`, `feature-billing`), not by technical layers.
   - You should flag if you see general broad directories like `controllers/`, `services/`, or `models/` containing disparate domain logic. Features should be cohesive standalone vertical slices.

2. **Clean / Hexagonal Architecture**
   - Core business logic must be isolated from external delivery mechanisms (HTTP/Express) and infrastructure (Databases/ORM like Drizzle).
   - SQL/ORM logic (e.g., `JOIN`s, `WHERE` clauses, `db.select`) is **strictly forbidden** in business logic.
   - Database schemas must not leak into the UI.

3. **Task-Based (Intentful) APIs**
   - APIs should be modeled after real-world business intents and workflows (e.g., `POST /admit-patient`), NOT standard noun-based CRUD (e.g., avoid `POST /visits` just to create a visit without intent).

4. **Functional & Procedural Programming Over OOP Bloat**
   - Do not use massive `Service` classes holding internal state.
   - Every API use-case gets its own individual file (e.g., `admit-patient.ts` instead of a monolithic `PatientService.ts` containing `admit`, `discharge`, and `update`).
   - Rely on pure functions, immutable data pipelines, and explicit dependency passing.

## Expected Layering & Strict Responsibilities

Evaluate if the code is placed in the correct layer and obeys its boundaries:

- **Contracts (`libs/shared/contracts/`)**: The API boundary. Must define the exact shape of inputs and outputs using tools like Zod. Must NOT contain DB code.
- **Handlers (`http-handlers/`)**: The "Translators". They extract data from requests, validate via Contracts, call the Use Case, and format the HTTP response. They must contain **NO business logic**.
- **Use Cases (`use-cases/`)**: The "Rulebooks". They enforce business rules, orchestrate workflows, and make decisions. They must NOT know about HTTP statuses or ORM syntax.
- **Data Access (`data-access/`)**: The "Librarians". They execute SQL/ORM queries. They just fetch or save data. They must NOT enforce business logic or throw business errors.

## Code Review Process

When asked to review code, follow these steps:

1. **Understand the Intent**: Briefly summarize what the code is trying to achieve.
2. **Layer Check**: Verify that the files modified or created belong to the appropriate layers (Contract, Handler, Use Case, Data Access).
3. **Rule Enforcement**: Walk through each modified section and explicitly call out violations of the Review Principles. For example:
   - *Is there a database query in the Use Case?* -> **Violation**.
   - *Is the HTTP Handler making a business decision?* -> **Violation**.
   - *Is a massive class being used instead of a single-purpose procedural function?* -> **Violation**.
   - *Is the code grouped by technical concern rather than feature slice?* -> **Violation**.
4. **Domain Agnosticism**: Focus heavily on structural integrity. Look closely at the dependency direction and separation of concerns.

## Report Structure

ALWAYS use this exact template for your feedback:

# Architecture Review

## Summary of Changes
[Brief description of what the PR/diff does]

## Alignment Assessment
[Verdict: Perfectly Aligned / Minor Deviations / Major Violations / Justified Deviation]

## Detailed Findings

### 🟢 The Good
- [List structural patterns where the code perfectly adheres to the boundaries]

### 🔴 Violations & Concerns
- [List specific violations, referencing the file and the exact architectural rule broken. Explain *why* it's a violation and how it damages the architecture.]

### 🟡 Justified Deviations (If Any)
- [If they broke a rule, evaluate if their justification makes architectural sense. If not justified, move this to Violations.]

## Recommended Actions
- [Clear, step-by-step refactoring instructions to bring the code into full alignment. For example, "Move the `db.select()` call out of the use case and into a new function in the data-access repository."]
