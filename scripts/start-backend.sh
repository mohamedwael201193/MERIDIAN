#!/usr/bin/env bash
# Free-tier startup: run idempotent migrations, then start the backend.
set -euo pipefail

find_repo_root() {
  local dir="$1"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/deployed/addresses.json" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

ROOT="$(find_repo_root "$(cd "$(dirname "$0")/.." && pwd)")" || {
  echo "start_backend: deployed/addresses.json not found in repo tree" >&2
  exit 1
}
cd "$ROOT"

if [[ ! -f backend/dist/db/migrate.js ]]; then
  echo "start_backend: backend/dist/db/migrate.js missing (build must run first)" >&2
  exit 1
fi

if [[ ! -d backend/dist/db/migrations ]]; then
  echo "start_backend: backend/dist/db/migrations missing (build must copy SQL files)" >&2
  exit 1
fi

echo "start_backend: applying pending migrations (idempotent)..."
node backend/dist/db/migrate.js
echo "start_backend: migrations complete, starting server..."
exec node backend/dist/main.js
