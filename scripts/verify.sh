#!/usr/bin/env bash
# Single local quality gate: format → lint → types → unit → integration → build.
# Used by /build, the reviewer agent and CI. Any missing piece is a failure, never a skip.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n▶ %s\n' "$1"; }
fail() { printf '\n✖ verify.sh: %s\n' "$1" >&2; exit 1; }

step "harness selfcheck"
node scripts/harness/selfcheck.mjs

[[ -f package.json ]] || fail "package.json is missing (the app must be scaffolded)"

for script in format:check lint typecheck test:unit test:integration build; do
  node -e "process.exit(require('./package.json').scripts?.['$script'] ? 0 : 1)" \
    || fail "package.json has no '$script' script"
done

if [[ ! -d node_modules ]]; then
  step "install dependencies"
  npm ci
fi

step "format check";  npm run --silent format:check
step "lint";          npm run --silent lint
step "type check";    npm run --silent typecheck
step "unit tests";    npm run --silent test:unit

step "integration tests (PostgreSQL 18)"
if [[ -z "${DATABASE_URL:-}" ]]; then
  # shellcheck source=lib/require-docker.sh
  source scripts/lib/require-docker.sh || fail "DATABASE_URL is not set and Docker is not usable"
  cid=$(docker run -d --rm -e POSTGRES_PASSWORD=verify -p 127.0.0.1::5432 postgres:18.3)
  trap 'docker stop "$cid" >/dev/null 2>&1 || true' EXIT
  for _ in $(seq 1 60); do
    docker exec "$cid" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 && break
    sleep 1
  done
  docker exec "$cid" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1 \
    || fail "PostgreSQL did not become ready"
  port=$(docker port "$cid" 5432/tcp | head -n 1 | sed 's/.*://')
  export DATABASE_URL="postgres://postgres:verify@127.0.0.1:${port}/postgres"
fi
npm run --silent test:integration

step "build"; npm run --silent build

printf '\n✔ verify.sh: all checks passed\n'
