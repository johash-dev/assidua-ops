#!/usr/bin/env bash
# Proves scripts/e2e.sh behaves (AO-7 AC 3, 4): passes a clean page, fails with the axe rule
# named on a page with violations, and refuses to run without a URL.
# Serves e2e/fixtures/ from a throwaway local server; the fixtures are not part of the app.
# Needs Playwright's chromium (npx playwright install chromium). Not part of verify.sh.
set -uo pipefail
cd "$(dirname "$0")/../.."

failures=0
pass() { printf '  ok   %s\n' "$1"; }
bad() { printf '  FAIL %s\n' "$1"; failures=$((failures + 1)); }

tmp=$(mktemp -d)
server_pid=
cleanup() {
  [[ -n $server_pid ]] && kill "$server_pid" 2>/dev/null
  rm -rf "$tmp" .artifacts/__verify_e2e
}
trap cleanup EXIT

cat > "$tmp/serve.mjs" <<'JS'
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const server = createServer(async (req, res) => {
  const name = (req.url ?? '/').split('?')[0].replace(/^\//, '');
  try {
    const body = await readFile(`e2e/fixtures/${name}.html`);
    res.writeHead(200, { 'content-type': 'text/html' }).end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
server.listen(0, '127.0.0.1', () => console.log(server.address().port));
JS
cp "$tmp/serve.mjs" ./__verify_e2e_serve.mjs
node ./__verify_e2e_serve.mjs > "$tmp/port" &
server_pid=$!
trap 'cleanup; rm -f ./__verify_e2e_serve.mjs' EXIT
for _ in $(seq 1 50); do [[ -s $tmp/port ]] && break; sleep 0.1; done
port=$(cat "$tmp/port")
[[ -n $port ]] || { echo "✖ fixture server did not start" >&2; exit 1; }
base="http://127.0.0.1:$port"

echo "e2e.sh:"

out=$(SMOKE_PATH=clean bash scripts/e2e.sh "$base" --grep @smoke 2>&1); code=$?
if [[ $code -eq 0 ]]; then pass "clean page → exit 0"; else bad "clean page exited $code"; printf '%s\n' "$out" | tail -15; fi

out=$(SMOKE_PATH=violation bash scripts/e2e.sh "$base" --grep @smoke 2>&1); code=$?
if [[ $code -ne 0 && $out == *image-alt* ]]; then
  pass "page with violations → exit $code naming image-alt"
else
  bad "violation page (exit $code, image-alt named: $([[ $out == *image-alt* ]] && echo yes || echo no))"
fi

out=$(SMOKE_PATH=clean bash scripts/e2e.sh "$base" --grep @no-such-tag 2>&1); code=$?
if [[ $code -ne 0 ]]; then pass "no matching tests → exit $code"; else bad "zero tests exited 0"; fi

out=$(bash scripts/e2e.sh 2>&1); code=$?
if [[ $code -eq 64 && $out == *usage* ]]; then pass "no URL → exit 64 with usage"; else bad "no URL (exit $code)"; fi

out=$(SMOKE_PATH=clean bash scripts/e2e.sh "$base" --ui-capture __verify_e2e 2>&1); code=$?
if [[ $code -eq 0 && -f .artifacts/__verify_e2e/desktop-1280.png && -f .artifacts/__verify_e2e/mobile-375.png \
  && -f .artifacts/__verify_e2e/desktop/axe.json ]]; then
  pass "--ui-capture writes 1280px and 375px screenshots and axe JSON"
else
  bad "--ui-capture (exit $code)"; printf '%s\n' "$out" | tail -10
fi

if ((failures)); then
  printf '\n✖ verify-e2e: %d check(s) failed\n' "$failures" >&2
  exit 1
fi
printf '\n✔ verify-e2e: all checks behaved as expected\n'
