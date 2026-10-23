---
name: qa
description: Verify merged stories on the deployed QA environment using the qa-tester subagent (AC-derived e2e plus exploratory negative paths), record results in Jira, and move passing stories to Ready for UAT or bounce failures with linked Bugs.
argument-hint: [AO-key] (default: all stories in Ready for QA)
---

Follow `docs/harness/skill-conventions.md`.

1. Select the stories: the argument, or JQL `status = "Ready for QA"`. Transition each to `In QA`.
2. Confirm the latest `deploy-qa` run succeeded and includes each story's merge SHA (`gh run list --workflow deploy-qa.yml`). If it is still running: **Next →** waiting.
3. If `github.environments.qa.url` is null (hosting not decided yet), run against a local build and say clearly in the report that **this is not environment QA**.
4. Launch the `qa-tester` subagent with the story keys, their AC and the base URL.
5. **Per story:**
   - **PASS**: comment with the evidence (SHA, specs, results), then transition to `Ready for UAT`.
   - **FAIL**: ⛔ gate with the proposed Bug(s). On approval, create each Bug (template in `jira-model.md`, linked to the story, `scope:approved`, and the story's `area:` label), transition the story back to `In Progress`, and comment.
6. If new e2e specs were written, commit them on a branch `AO-<n>-e2e` and route them through `/review` → `/ship` (they are code too).

End with the evidence report. **Next →** per `next-step.md`: either the next Ready story, `/build` for a bounced story, or `/release-uat` once every fixVersion story is Ready for UAT.
