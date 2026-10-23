# Deploy targets

ADR-002 (hosting) adds `scripts/deploy/<target>.sh` and records it in `harness.config.json` → `hosting.deployScript`.

Contract: `bash scripts/deploy/<target>.sh <qa|staging|production> <git-ref>`
- The script is idempotent. It runs database migrations before switching traffic, and exits non-zero on any failure.
- It reads credentials only from GitHub environment secrets (never from the repo).
- For `production`, it takes a pre-deploy database snapshot when the host supports one, and prints the snapshot id.
- It prints the deployed version and URL on success.
