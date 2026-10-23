---
name: build
description: Implement the approved plan for the current story with a test-first loop, keeping the change small and in scope, until scripts/verify.sh passes. Also used to fix review findings, QA bounces or red CI on the story branch.
argument-hint: [AO-key] (defaults to the story on the current branch)
---

Follow `docs/harness/skill-conventions.md`.

1. Resolve the story from the argument or the branch. Load `.claude/state/plan-AO-<n>.md`, plus any open review/QA findings (Jira comments, `.claude/state/review-AO-<n>.md`, a failing CI log). If no approved plan exists, stop: **Next →** `/start AO-<n>`.
2. For each AC in the plan's test-first order:
   1. Write the test at the public boundary. Run it and **confirm it fails for the intended reason**.
   2. Write the minimum code that makes it pass, following the patterns the plan cites.
   3. Refactor without weakening the test.
3. **Verify APIs**: for each new library call, confirm it exists in the installed version (types or docs inside the installed package). Never rely on memory.
4. Run `bash scripts/verify.sh`. Fix the root causes. You get at most 3 fix iterations, and never skip, weaken or delete a test to get there. If it is still red, stop and report the failing output.
5. **Scope check**: compare `git diff --stat origin/main...HEAD` with the plan's file list. Revert anything unrelated, or justify it.
6. Commit in small logical commits: `AO-<n> <imperative summary>`. Don't push here; `/ship` does that.

Evidence report: quote the `verify.sh` summary lines (from this run, not memory), list the tests added per AC, and list the files changed.

End with **Next →** (normally `/review AO-<n>`).
