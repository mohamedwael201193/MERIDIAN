#!/usr/bin/env bash
# Free-tier startup: run idempotent migrations, then start the backend.
set -euo pipefail
cd "$(dirname "$0")/.."

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
