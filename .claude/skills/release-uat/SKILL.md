---
name: release-uat
description: Cut a UAT release candidate — generate release notes and the client UAT checklist from Jira, tag vX.Y.Z-rc.N, approve and verify the staging deployment, and move stories to In UAT. Use when the fixVersion's stories are Ready for UAT.
argument-hint: <version, e.g. 1.0.0-rc.1>
disable-model-invocation: true
---

Follow `docs/harness/skill-conventions.md`.

1. **Pre-checks:**
   - every issue in the fixVersion is `Ready for UAT` (otherwise list the stragglers and stop)
   - `main` CI is green
   - no open Critical/High Bugs on the fixVersion
   - `hosting.decided` is true
2. **Generate:**
   - release notes, grouped by §3.x capability, in plain client language
   - `docs/runbooks/uat-checklist.md`: one row per story, with its AC rewritten as client test steps, grouped by §
   - the §7 acceptance rules summary: 20 business days, written defect list, Critical Defect definition, deemed acceptance
3. ⛔ Gate: show the notes, the checklist and the version.
4. On approval:
   - commit the docs via a short PR (the `/ship` flow, under a Task key)
   - `git tag v<version> && git push origin v<version>`, which triggers `deploy-staging`
   - when the run waits on the `staging` environment, approve it with `node scripts/harness/approve-deployment.mjs <run-id> staging`
   - `gh run watch <run-id>`
5. **Smoke test** staging: `bash scripts/e2e.sh <staging-url> --grep @smoke`.
6. **Jira:**
   - transition the stories to `In UAT`
   - comment with the rc version
   - record the UAT start date (Asia/Colombo) in the fixVersion description, for the 20-business-day clock
7. Draft the client handover message (UAT link, checklist, how to report defects in writing). Show it to Johash to send. **Never send it yourself.**

End with the evidence report and **Next →** (waiting on client feedback, with the business days remaining; meanwhile the best parallel task).
