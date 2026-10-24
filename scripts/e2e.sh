#!/usr/bin/env bash
# End-to-end checks against a running environment (Playwright + axe-core).
#   bash scripts/e2e.sh <base-url> [--grep <pattern>] [--ui-capture <story-key>]
# --ui-capture writes screenshots (1280px, 375px) and an axe-core report to .artifacts/<story-key>/.
# Exits 64 on bad usage, otherwise Playwright's exit code (zero tests found is a failure).
set -euo pipefail
cd "$(dirname "$0")/.."

usage() { echo "usage: scripts/e2e.sh <base-url> [--grep p] [--ui-capture KEY]" >&2; exit 64; }

[[ $# -ge 1 && $1 != -* ]] || usage
BASE_URL=$1
shift

grep_args=()
while [[ $# -gt 0 ]]; do
  case $1 in
    --grep) [[ $# -ge 2 ]] || usage; grep_args=(--grep "$2"); shift 2 ;;
    --ui-capture) [[ $# -ge 2 ]] || usage; export UI_CAPTURE_KEY=$2; shift 2 ;;
    *) usage ;;
  esac
done

export BASE_URL
# Playwright exits non-zero when no tests match (--pass-with-no-tests is deliberately not used).
exec npx playwright test --config e2e/playwright.config.ts "${grep_args[@]}"
