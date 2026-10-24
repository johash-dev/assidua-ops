# Deploy Runbook

| Env | Trigger | Approval | Workflow |
|---|---|---|---|
| qa | merge to `main` | none | `.github/workflows/deploy-qa.yml` |
| staging (UAT) | tag `vX.Y.Z-rc.N` | ⛔ Johash (GitHub environment reviewer, approved from `/release-uat`) | `deploy-staging.yml` |
| production | tag `vX.Y.Z` | ⛔ Johash (from `/release-prod`, after pre-flight) | `deploy-prod.yml` |

The deploy step calls `scripts/deploy/<target>.sh <env> <git-ref>`, where the target is set in `harness.config.json` → `hosting.deployScript` (ADR-002: Render, `scripts/deploy/render.sh`, added by AO-22). Until it is set:
- `deploy-qa.yml` skips the deploy with a warning, and `/qa` runs against a local build and reports that it is not environment QA.
- `deploy-staging.yml` and `deploy-prod.yml` fail (exit 1). Do not cut an `-rc` or release tag before AO-22 lands.

## Production pre-flight (enforced by `/release-prod` + the guard hook)
1. Every issue in the fixVersion is in Ready for Prod. Zero open Critical/High Bugs.
2. Migrations reviewed, with a rollback noted in the PR.
3. A fresh backup/snapshot confirmed (operating guide, PostgreSQL dump procedure).
4. Release notes generated.
5. Then `.claude/state/preflight-<version>.ok` is written. The guard hook refuses any prod deploy without it.

## Rollback
Re-deploy the previous `vX.Y.Z` tag via `deploy-prod.yml`. Restore the DB only for data-corrupting releases, and then only per the operating guide.
