#!/usr/bin/env bash
# Format one file with Prettier. Usage: scripts/format-file.sh <file>
set -euo pipefail
file="${1:-}"
[[ -n "$file" ]] || { echo "usage: scripts/format-file.sh <file>" >&2; exit 2; }
[[ -f "$file" ]] || { echo "format-file: no such file: $file" >&2; exit 1; }

case "$file" in
  *.ts|*.tsx|*.js|*.mjs|*.cjs|*.json|*.css|*.md|*.yml|*.yaml) ;;
  *) echo "format-file: unsupported file type: $file" >&2; exit 1 ;;
esac

cd "$(dirname "$0")/.."
npx --no-install prettier --write "$file"
