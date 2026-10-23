---
name: release-prod
description: Release a version to production — run the pre-flight (all issues Ready for Prod, no open Critical/High, migrations reviewed, backup confirmed), then after approval tag vX.Y.Z, approve the production deployment, smoke test, release the Jira version and publish release notes.
argument-hint: <version, e.g. 1.0.0>
disable-model-invocation: true
---

Follow `docs/harness/skill-conventions.md` and `docs/runbooks/deploy.md`.

1. **Gather pre-flight facts:**
   - Jira: confirm every fixVersion issue is `Ready for Prod`, and count the open Critical/High Bugs
   - GitHub: confirm `main` CI is green and the latest `v<version>-rc.N` deployed to staging
   - list the migrations in the release, each with its rollback note
   - ask Johash for the backup/snapshot id taken in the last 24h
2. Run `node scripts/harness/preflight.mjs v<version> --jira-ready <true|false> --open-critical-high <n> --backup-id <id>`. The script re-checks GitHub itself, and writes `.claude/state/preflight-v<version>.ok` only if every check passes. On failure, list what failed and stop.
3. ⛔ Gate. Show:
   - the version
   - the commit range since the last prod tag
   - the stories and bugs included
   - the migrations
   - the rollback plan (redeploy the previous tag)
   - the backup id
4. On approval (the guard hook enforces the pre-flight marker):
   - `gh release create v<version> -R <repo> --target main --notes-file <generated>`, which creates the tag and triggers `deploy-prod`
   - `node scripts/harness/approve-deployment.mjs <run-id> production`
   - `gh run watch <run-id>`
5. **Smoke test** prod: `bash scripts/e2e.sh <prod-url> --grep @smoke`. This is read-only smoke only, never data-mutating tests. If it fails: recommend a rollback via a redeploy of the previous tag, and stop.
6. **Jira:** transition the issues to `Done`, release the fixVersion, and comment with the prod version.
7. On the first go-live (1.0.0), record `project.goLiveDate` in `harness.config.json`. This starts the 6-month warranty clock, and `/today` tracks it.
8. Update `docs/harness/metrics.md` with the release row.

End with the evidence report and **Next →** (`/learn release-v<version>`, a retro, then `/today`).
