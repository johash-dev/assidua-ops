---
name: hotfix
description: Warranty/production defect fast path — confirm it is a genuine in-scope defect, start the §8 SLA clock, branch from the production tag, fix test-first, review, and release a 1.0.x patch through the normal gates. Use for production Bugs.
argument-hint: <AO-key of the Bug>
---

Follow `docs/harness/skill-conventions.md`.

1. **Triage**: run the `/scope-check` classification. Warranty covers only genuine in-scope defects (§8). Cosmetic issues, new features, misconfiguration and third-party outages are not covered, so for those, draft a reply and a CR instead.
2. **SLA**: priority (Critical/High/Medium/Low), the response target, and the time elapsed since report. Comment "Investigation started <time Asia/Colombo>" on the Bug. This is the §8 response.
3. Branch `hotfix/AO-<n>-<slug>` from the latest prod tag `v1.0.z`. Set the Bug's fixVersion to `1.0.(z+1)`.
4. **Reproduce first**: write a failing regression test that captures the defect. Then fix it (the `/build` loop rules apply), then run `/review` (the reviewer subagent is mandatory, even when urgent).
5. ⛔ Merge gate (same as `/ship`). Merge into `main`. If `main` has unreleased work, ⛔ ask whether to release from a tag on the hotfix branch instead.
6. Release through `/release-uat 1.0.(z+1)-rc.1` (it may be shortened to a staging smoke test only, with Johash's approval), then `/release-prod 1.0.(z+1)`.

End with the evidence report and **Next →** (`/learn AO-<n>`).
