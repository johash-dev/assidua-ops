#!/usr/bin/env bash
# Sourced by scripts that need Docker. Fails with a clear message when the daemon is unreachable
# (the CLI can be installed while Docker Desktop is stopped).
if ! command -v docker >/dev/null 2>&1; then
  echo "✖ Docker is not installed. Install Docker, or set DATABASE_URL to an existing PostgreSQL 18." >&2
  return 1 2>/dev/null || exit 1
fi
if ! docker info >/dev/null 2>&1; then
  echo "✖ Docker is installed but not running. Start Docker Desktop (or the docker daemon) and retry, or set DATABASE_URL." >&2
  return 1 2>/dev/null || exit 1
fi
