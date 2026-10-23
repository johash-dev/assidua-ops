#!/usr/bin/env bash
# End-to-end checks against a running environment.
#   bash scripts/e2e.sh <base-url> [--grep <pattern>] [--ui-capture <story-key>]
# --ui-capture writes screenshots (1280px, 375px per state) and an axe-core report to .artifacts/<story-key>/.
# Filled in by the ADR-001 wiring task (Playwright + @axe-core/playwright).
set -euo pipefail
cd "$(dirname "$0")/.."

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" ]]; then echo "usage: scripts/e2e.sh <base-url> [--grep p] [--ui-capture KEY]" >&2; exit 64; fi

if ! node -e "process.exit(require('./harness.config.json').stack.decided ? 0 : 1)"; then
  echo "⚠ e2e.sh: NOT CONFIGURED (stack undecided, see ADR-001). No tests ran." >&2
  exit 3
fi

echo "TODO: npx playwright test --config e2e/playwright.config.ts (BASE_URL=$BASE_URL)" >&2
exit 3
