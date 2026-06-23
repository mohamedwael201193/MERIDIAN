#!/usr/bin/env bash
# Run unit + integration tests N times; fail on first failure.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNS="${1:-10}"

echo "Stability run: $RUNS consecutive passes (unit + integration)"

for i in $(seq 1 "$RUNS"); do
  echo "=== Run $i/$RUNS ==="
  (cd "$ROOT/contracts" && cargo odra test) >/dev/null
  "$ROOT/scripts/run-integration-tests.sh" >/dev/null
done

echo "All $RUNS runs passed."
