#!/usr/bin/env bash
# Proves verify.sh and format-file.sh fail when they should (AO-4 AC 2, 3, 4).
# Breaks things on purpose (temp files, or a throwaway copy) and asserts the exit
# code and the step that failed. Run in CI; it is not part of verify.sh itself.
set -uo pipefail
cd "$(dirname "$0")/../.."
root=$PWD

failures=0
pass() { printf '  ok   %s\n' "$1"; }
bad() { printf '  FAIL %s\n' "$1"; failures=$((failures + 1)); }

tmp=$(mktemp -d)
cleanup() { rm -rf "$tmp" "$root"/src/__neg_*; }
trap cleanup EXIT

# expect_verify_fails <label> <expected> [dir]
# <expected> starting with "msg:" must appear in the output (failure before any step
# runs); otherwise it is the step that must be the last one started.
expect_verify_fails() {
  local label=$1 expected=$2 dir=${3:-$root} out code last step ok=0
  step=${expected#msg:}
  out=$(cd "$dir" && bash scripts/verify.sh 2>&1)
  code=$?
  last=$(printf '%s\n' "$out" | grep '^▶' | tail -n 1)
  if [[ $expected == msg:* ]]; then
    [[ $out == *"$step"* ]] && ok=1
  else
    [[ $last == "▶ $step"* ]] && ok=1
  fi
  if [[ $code -ne 0 && $ok -eq 1 ]]; then
    pass "$label → exit $code at '$step'"
  else
    bad "$label (exit $code, last step: ${last:-none})"
  fi
}

echo "verify.sh must fail:"

# A throwaway copy without node_modules: fails before anything is installed.
mkdir "$tmp/copy"
tar --exclude=node_modules --exclude=.git --exclude=.next -cf - . | tar -xf - -C "$tmp/copy"
rm "$tmp/copy/package.json"
expect_verify_fails "no package.json" "msg:package.json is missing" "$tmp/copy"

cp "$root/package.json" "$tmp/copy/package.json"
(cd "$tmp/copy" && node -e "
const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));
delete p.scripts.typecheck;fs.writeFileSync('package.json',JSON.stringify(p));")
expect_verify_fails "unconfigured step (no typecheck script)" "msg:no 'typecheck' script" "$tmp/copy"

printf 'export const   badlyFormatted = {a:1}\n' > src/__neg_format.ts
expect_verify_fails "unformatted file" "format check"
rm -f src/__neg_format.ts

printf 'export const unsafe: any = 1;\n' > src/__neg_lint.ts
expect_verify_fails "lint error" "lint"
rm -f src/__neg_lint.ts

printf "export const wrong: number = 'a';\n" > src/__neg_type.ts
expect_verify_fails "type error" "type check"
rm -f src/__neg_type.ts

printf "import { expect, it } from 'vitest';\n\nit('fails', () => {\n  expect(1).toBe(2);\n});\n" > src/__neg_fail.test.ts
expect_verify_fails "failing unit test" "unit tests"
rm -f src/__neg_fail.test.ts

echo "format-file.sh:"
printf 'export const   x = {a:1}\n' > src/__neg_ok.ts
if bash scripts/format-file.sh src/__neg_ok.ts >/dev/null 2>&1 && [[ "$(cat src/__neg_ok.ts)" == "export const x = { a: 1 };" ]]; then
  pass "formats a TypeScript file"
else
  bad "did not format a TypeScript file"
fi

if bash scripts/format-file.sh src/__neg_missing.ts 2>"$tmp/err"; then
  bad "missing file exited 0"
else
  grep -q "no such file" "$tmp/err" && pass "missing file → non-zero with message" || bad "missing file: no message"
fi

printf 'x' > src/__neg_image.png
if bash scripts/format-file.sh src/__neg_image.png 2>"$tmp/err"; then
  bad "unsupported file exited 0"
else
  grep -q "unsupported" "$tmp/err" && pass "unsupported file → non-zero with message" || bad "unsupported file: no message"
fi

if ((failures)); then
  printf '\n✖ verify-negative: %d check(s) failed\n' "$failures" >&2
  exit 1
fi
printf '\n✔ verify-negative: all checks behaved as expected\n'
