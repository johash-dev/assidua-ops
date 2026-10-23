---
name: review
description: Independent skeptical review of the current story branch — runs the reviewer subagent (and ui-reviewer for ui stories) on the real diff and real test output against the story's acceptance criteria and the quality checklist. Use after /build and before /ship.
argument-hint: [KAN-key]
---

Follow `docs/harness/skill-conventions.md`. **Don't review your own work in this context.** Delegate it.

1. Resolve the story. Fetch its AC from Jira and load the plan file.
2. Launch the `reviewer` subagent with: the story key, the AC text, the scope ref, and the base `origin/main`. If the story has the `ui` label, launch the `ui-reviewer` too, in parallel.
3. Collect the verdicts. Save the combined report to `.claude/state/review-KAN-<n>.md`, and add a short version as a Jira comment.
4. **Triage:**
   - BLOCK → list the blocking findings. Don't fix them in this skill.
   - PASS → list the advisory items, plus the ui-reviewer's "Needs human eye" items. Johash looks at these at the merge gate.
5. Record whether this was a first-pass PASS (for `/learn` metrics), as a line in the review file.

End with the evidence report. **Next →** is `/ship KAN-<n>` on PASS, or `/build KAN-<n>` (fix the findings) on BLOCK.
