# CI Step 7: Headless AI Review Architecture

This document summarizes how the head-less CI step 7 operates. Step 7 acts as a completely deterministic pipeline gate driven entirely by local CLI commands, meaning it will function flawlessly both locally and on arbitrary GitHub Action Runners. 

It orchestrates three independent `opencode` agents to process GitHub PRs, without relying on external SaaS features. It does this effectively by chunking context management dynamically and wrapping LLM behavior in robust Javascript CLI scripts to enforce deterministic CI passes/failures.

## Flow Breakdown

### 1. `collect-ai-context.mjs` (Context Collector)
This script isolates the retrieval of raw codebase state differences out of Git.
- **Git Range Deduction**: Resolves the exact PR commit range using NX Environment variables (`NX_BASE`/`NX_HEAD`), checking against GitHub defaults (`CI_BASE_REF`), and eventually using git-native fallbacks (e.g. `HEAD~1`).
- **Data Filtering**: Collects `pr.diff` (raw patch contents) and `changed_files.txt` (list of files). It explicitly skips large binaries (images like `.png`, `.webp`, etc) and dependency lock files (like `package-lock.json`, `bun.lockb`) so the context doesn't blow up token limits.
- **Nx Integration**: Triggers `nx graph` specifically focused on dependency trees for the agent to have modular structure context.

### 2. `run-ai-review-step7.mjs` (The Orchestrator)
This script reads the context gathered above and marshals three independent AI agents using explicit `opencode run` CLI invocations.
- **Dynamic File Attaching**: Uses the `changed_files.txt` list, verifies files physically exist relative to the git project root, asserts they are realistically smaller than 512KB (preventing memory crashes or model exhaustion), and explicitly appends them as `--file` arguments to Opencode.
- **Phase A (Parallel/Sequential Intel Gathering)**: 
  - Triggers **`step7-architecture-review.md`**: Focuses ONLY on module boundary alignment and `ARCHITECTURE_GUIDELINES.md` compliance setup. Uses `code-review-flow` skill.
  - Triggers **`step7-code-quality-review.md`**: Acts as a rigorous, file-by-file logic inspector scanning for performance and maintainability defects. Uses `code-review-expert` skill.
- **Phase B (Synthesis/The Arbiter)**:
  - Takes the two previous agent reports and any available User Stories / Engineering Tasks and feeds them into the final **`step7-arbiter-review.md`** agent.
  - The Arbiter's strict contract expects it to output `CI_DECISION: PASS` or `CI_DECISION: FAIL` based on the previous context.
- **The Physical CI Gate**: The orchestrator parses the Arbiter report output and asserts the pipeline status via `process.exit(1)` if `FAIL` or if dangerous labels like `[CRITICAL]` or `[BLOCKER]` are present in the summary text.

## Edge Cases Resolved & Outstanding Safeguards

- **Buffer Overflow on Spawn**: Internal sub-process spawns mapping local commands to Git/OpenCode use explicitly relaxed stream buffers (`maxBuffer: 10 * 1024 * 1024` / 10MB limits vs 1MB default limits), resolving `ENOBUFS` failure possibilities for exceptionally large PRs in `spawnSync`.
- **Path Resolution**: The scripts resolve paths dynamically relative to their actual physical location (`import.meta.url`) instead of relying on unstable runtime `cwd` variables. This allows the dispatch script to natively locate and pipe specific `--file` attachments into the agent safely regardless of where they are invoked from.
- **Binary/Lock Exclusion**: Native Pathspec ignores in `git diff` (`:(exclude)...`) enforce pristine diff structures for context delivery, maximizing relevance without using excess API tokens.
