#!/usr/bin/env bash
# Phase 8 — run full E2E stack locally (backend + x402 + optional MCP)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
set -a && source "$ROOT/.env" && set +a

echo "Building packages..."
pnpm --filter @meridian/backend run build
pnpm --filter @meridian/x402-facilitator run build
pnpm --filter @meridian/mcp-server run build

echo "Running E2E tests..."
pnpm exec vitest run --config "$ROOT/tests/e2e/vitest.config.ts"
