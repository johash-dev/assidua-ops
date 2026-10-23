---
name: start
description: Begin work on a Ready Jira story — move it In Progress, create the story branch, explore the codebase with the explorer subagent, and produce a test-first implementation plan for approval. Use when picking up a story.
argument-hint: <KAN-key>
---

Follow `docs/harness/skill-conventions.md`.

1. **Preconditions** (stop if one fails):
   - the story is `Ready`
   - the working tree is clean
   - `stack.decided` is true, unless the story is an ADR/tooling Task
   - no other story of mine is `In Progress`, unless Johash says to run them in parallel
2. Run `git fetch`. Create the branch `KAN-<n>-<short-slug>` from `origin/main`. Transition the story to `In Progress` and assign it to Johash.
3. **Explore**: launch the `explorer` subagent with the story text. Don't read the whole repo yourself.
4. **Plan**, using the explorer brief:
   - **Approach**: 3–6 bullets. Reuse the patterns the explorer found, and cite the paths.
   - **Files to add/change**, each mapped to an AC. Anything unmapped needs a reason.
   - **Tests first**: the test cases per AC (unit / integration / e2e), the negative cases, and where they live.
   - **Migrations / data impact**, with a rollback.
   - **Risks and unknowns**, and how you'll resolve each.
   - **Out of scope** for this PR.
   - **Size check**: if the plan exceeds ~1 day or ~400 changed lines, propose splitting the story instead.
5. ⛔ Gate: Approve / Change / Split story / Stop.
6. On approval: post the plan as a Jira comment, and save it to `.claude/state/plan-KAN-<n>.md` so `/build` and `/review` can read it.

End with the evidence report and **Next →** (normally `/build KAN-<n>`).
