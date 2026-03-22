---
name: pr-ai-review-workflow
description: Fetches AI Review workflow output for a GitHub PR via gh and saves it under local-notes, then guides remediation so the PR can pass. Use when the user shares a PR URL (including private repos), mentions AI Review / ai-review.yml, workflow run links, summary_raw, or wants actionable follow-ups from the bot comment on a pull request.
---

# PR AI Review workflow (fetch + follow-up)

## Prerequisites (GitHub CLI)

Follow **[gh-cli](../gh-cli/SKILL.md)** for installation, `gh auth login`, and environment variables.

**Minimum for private repos and Actions artifacts**

- `gh` on `PATH` (Windows: `winget install --id GitHub.cli`).
- Authentication with a token that can read the repo, issue comments, Actions runs, and workflow artifacts. Prefer **`GH_TOKEN`** or **`GITHUB_TOKEN`** in automation; otherwise `gh auth login` and the script will call `gh auth token`.
- Typical scope: `repo` (private repos + Actions artifacts). For GitHub Enterprise Server, also set **`GH_HOST`** per the gh-cli skill.

## Phase A — Deterministic fetch (run the TypeScript script)

Do **not** hand-copy review text from the browser unless the script fails. The script is cross-platform (Node + `gh`; no shell-specific syntax).

### One-time setup

From the skill directory:

```bash
cd .agents/skills/pr-ai-review-workflow
npm install
```

### Run from repository root (recommended)

`--out-dir` defaults to `local-notes` relative to the **current working directory**, so run from the monorepo root if you want `local-notes/` at the top level.

```bash
cd /path/to/toy-poc-sdlc-demo
npx --yes tsx .agents/skills/pr-ai-review-workflow/scripts/fetch-ai-review-summary.ts --pr-url "https://github.com/OWNER/REPO/pull/123"
```

Or after `npm install` in the skill folder:

```bash
cd .agents/skills/pr-ai-review-workflow
npm run fetch -- --pr-url "https://github.com/OWNER/REPO/pull/123" --out-dir ../../../local-notes
```

### Flags

| Flag | Purpose |
|------|---------|
| `--pr-url` | GitHub pull request URL (required unless passed as sole positional). |
| `--out-dir` | Output directory (default: `./local-notes`). |
| `--run-id` | Actions **database** run id if discovery fails (from `.../actions/runs/<id>`). |
| `--repo` | `owner/name` override when the default remote does not match the PR’s fork. |

### How run id is discovered

1. **PR comments**: finds the latest `github-actions[bot]` comment containing `<!-- ai-review-report -->` (posted by `.github/workflows/ai-review.yml`) and extracts `.../actions/runs/<id>` from the “workflow run” link.
2. **Fallback**: `gh run list --workflow "AI Review" --commit <PR head SHA>` (same workflow **name** as in the YAML `name: AI Review`).

### What gets saved

Filename pattern: `pr-<N>-ai-review-<YYYY-MM-DD>.md` under `local-notes/`.

Content includes:

- **Job `summary_raw`** URLs per job (fetched with `Authorization: Bearer <token>`). GitHub may still return **404** for `summary_raw` even with a valid token; that is expected in some cases.
- **Workflow artifacts**: downloads `ai-review-reports-<run_id>` (see `ai-review.yml`) via `gh run download`, then embeds all nested `.md` reports (for example `final-review.md`, `architecture-review.md`). This path is the **reliable** source when `summary_raw` is empty.

### Manual `gh` equivalents (debugging)

Use these only if the script errors; they mirror what the script runs internally:

```bash
gh pr view 123 --repo OWNER/REPO --json headRefOid
gh api repos/OWNER/REPO/issues/123/comments --paginate
gh api repos/OWNER/REPO/actions/runs/RUN_ID/jobs
gh run download RUN_ID --repo OWNER/REPO --name ai-review-reports-RUN_ID -D ./tmp-artifacts
```

## Phase B — Agentic work (after the file exists)

1. **Read** the newest `local-notes/pr-*-ai-review-*.md` for the PR.
2. **Summarize blocking vs non-blocking** items using the report’s own severity labels (for example **FAIL**, **HIGH**, **CRITICAL**).
3. **Produce an ordered checklist** of code changes, tests to run locally, and CI commands (respect existing Nx/Bun conventions in this repo).
4. **Engineering tasks (only if needed)**  
   If fixes span multiple sessions or owners, add tasks under `engineering-tasks/` using the pattern in `engineering-tasks/example-task.md` (ID, linked user story, status, implementation bullets, definition of done). Prefer **updating existing** ET-* files when the report maps cleanly to them; create **new** tasks only when the work is genuinely new scope.

## Privacy and repo hygiene

- Treat downloaded markdown like **internal review material** (may reference paths, findings, or data-handling concerns).
- Optionally add `local-notes/` to `.gitignore` if these captures must not be committed.

## Related automation

- Workflow definition: `.github/workflows/ai-review.yml` (bot comment marker `<!-- ai-review-report -->`, artifact name `ai-review-reports-${{ github.run_id }}`).
