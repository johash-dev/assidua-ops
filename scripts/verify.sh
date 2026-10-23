#!/usr/bin/env bash
# Single local quality gate: format → lint → types → unit → integration → build.
# Used by /build, the reviewer agent and CI. Filled in by the ADR-001 wiring task.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n▶ %s\n' "$1"; }

step "harness selfcheck"
node scripts/harness/selfcheck.mjs

if ! node -e "process.exit(require('./harness.config.json').stack.decided ? 0 : 1)"; then
  printf '\n⚠ verify.sh: application checks NOT CONFIGURED (stack undecided, see ADR-001).\n'
  printf '  Only the harness selfcheck ran. Do not report app checks as passing.\n'
  exit 0
fi

# --- Replace the lines below when wiring the chosen stack (ADR-001) ---
step "format check";     echo "TODO: e.g. prettier --check ." && exit 3
step "lint";             echo "TODO"
step "type check";       echo "TODO"
step "unit tests";       echo "TODO"
step "integration tests (PostgreSQL)"; echo "TODO"
step "build";            echo "TODO"

printf '\n✔ verify.sh: all checks passed\n'
