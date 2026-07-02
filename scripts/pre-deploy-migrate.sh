#!/usr/bin/env bash
# Render Pre-Deploy: run pending SQL migrations. Non-zero exit cancels the deploy.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f backend/dist/db/migrate.js ]]; then
  echo "pre_deploy_migrate: backend/dist/db/migrate.js missing (build must run first)" >&2
  exit 1
fi

if [[ ! -d backend/dist/db/migrations ]]; then
  echo "pre_deploy_migrate: backend/dist/db/migrations missing (build must copy SQL files)" >&2
  exit 1
fi

echo "pre_deploy_migrate: applying pending migrations..."
node backend/dist/db/migrate.js
echo "pre_deploy_migrate: complete"
