---
name: today
description: Daily driver brief for Assidua Ops. Shows the board by status, in-flight stories, PRs/CI, environment versions, build-phase progress and UAT/warranty clocks, then names the single most important next task. Use at start of day or whenever unsure what to do next.
---

Follow `docs/harness/skill-conventions.md`. This skill is **read-only**: it makes no Jira or GitHub writes.

Gather, in parallel where possible:
1. **Jira** (JQL, project from config):
   - open issues grouped by status (`statusCategory != Done`)
   - build-phase progress: per epic, stories Done vs total
   - `assignee = currentUser() AND status in ("In Progress","In Review")`
   - top 3 `Ready` stories by rank
   - open Bugs by priority, with their `created` time
   - stories in `In UAT`
2. **GitHub:**
   - `gh pr list -R <repo> --author @me --json number,title,headRefName,statusCheckRollup,reviewDecision`
   - `gh run list -R <repo> -L 5`
   - the latest successful run of deploy-qa / deploy-staging / deploy-prod (version or SHA per environment)
3. **Client clocks** (contractual, not build schedule), computed in Asia/Colombo. Show each only once it has started:
   - **UAT business days left**: 20 from the UAT start recorded by `/release-uat`.
   - **Warranty months left**: counted from `project.goLiveDate`.
   - **Open warranty Bugs vs the §8 response targets**: flag Critical > 2h and High > 1 business day.
4. **Local:** current branch, uncommitted changes, and whether `scripts/verify.sh` is configured.

Render it compactly:
```
## Today — <date> · Phase: Foundation 3/8 | UAT day n/20 | Warranty month n/6   (omit clocks not started)
🔥 Fires: …            (omit if none)
▶ In flight: AO-12 (In Progress, branch, CI ✓/✗)
📋 Up next: AO-14, AO-15, AO-17
🧪 QA/UAT: …
🌐 Envs: qa vX @sha · staging vY · prod vZ
⚠ Setup gaps: …         (TODO config, stack/hosting ADRs pending)
```
End with the **Next →** block: the single most important task, chosen by the priority order in `docs/harness/next-step.md`.
