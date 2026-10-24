#!/usr/bin/env bash
# AO-7 AC 1: docker-compose.yml is valid, uses the same PostgreSQL tag as verify.sh and CI,
# and lets every host port be overridden. Needs the docker CLI only (no daemon).
set -uo pipefail
cd "$(dirname "$0")/../.."

fail() { printf '✖ verify-compose: %s\n' "$1" >&2; exit 1; }

pg=$(grep -o 'postgres:[0-9][0-9.]*' scripts/verify.sh | head -n 1)
[[ -n $pg ]] || fail "could not find the PostgreSQL tag in verify.sh"
grep -q "$pg" .github/workflows/ci.yml || fail "ci.yml does not use $pg"

cfg=$(docker compose config 2>&1) || fail "docker compose config is invalid: $cfg"
[[ $cfg == *"image: $pg"* ]] || fail "compose does not use image $pg"

cfg=$(AO_PG_PORT=55432 AO_MAIL_SMTP_PORT=51025 AO_MAIL_UI_PORT=58025 docker compose config)
for port in 55432 51025 58025; do
  [[ $cfg == *"published: \"$port\""* ]] || fail "host port override $port not honoured"
done
printf '✔ verify-compose: valid, %s, ports overridable\n' "$pg"
