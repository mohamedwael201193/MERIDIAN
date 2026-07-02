#!/usr/bin/env bash
# Legacy Render pre-deploy hook (deprecated — migrations run at startup on free tier).
# Kept so existing Render configs that still reference this path do not fail deploys.
set -euo pipefail
cd "$(dirname "$0")/.."
node backend/dist/db/migrate.js
