---
name: learn
description: Turn a failure, bounce, defect or release into durable improvement at the right layer (regression test, business rule, doc, skill, hook, script) and update harness metrics. Use after a QA/UAT bounce, a review BLOCK, a hotfix, a wrong Next → routing, or at each release or build-phase milestone.
argument-hint: <AO-key | release-vX.Y.Z | phase-<name> | free text>
---

Follow `docs/harness/skill-conventions.md`.

1. **Gather the facts**: the Jira history and comments, the review reports in `.claude/state/`, the CI logs, and what actually went wrong.
2. **Root cause**: why did the harness let it through? Which stage should have caught it?
3. **Pick the fix layer.** Prefer deterministic layers.

| Failure | Fix layer |
|---|---|
| Regression of a fixed bug | regression test |
| Invented API | review checklist item + API verification step in /build |
| Unrelated changes | scope check in /build, reviewer emphasis |
| Missed rule | new BR-n + test |
| Forgot a convention | CLAUDE.md or the relevant doc (keep it short) |
| Unsafe command attempted | guard hook rule + selfcheck case |
| Wrong next step | `docs/harness/next-step.md` |
| Claimed unrun tests | evidence requirement in the skill |

4. ⛔ Gate: show the proposed change(s).
5. On approval:
   - make the change on a branch (code/test/harness changes go through `/review` → `/ship`)
   - append a row to `docs/harness/lessons.md`
6. **Metrics** (for release and phase triggers): update `docs/harness/metrics.md` from Jira and GitHub:
   - stories done
   - first-pass review PASS rate
   - QA bounces
   - UAT defects by priority, and all defects by `area:` label (where they cluster)
   - median Ready→Done
   - unrelated-change findings

   Outcomes only, not activity counts.

End with the evidence report and **Next →**.
