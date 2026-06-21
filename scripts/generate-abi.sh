#!/usr/bin/env bash
# Generate TypeScript bindings from Odra contract schemas.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/packages/meridian-ts-types"
SCHEMA_DIR="$ROOT/contracts/resources/casper_contract_schemas"

mkdir -p "$OUT/src"

echo "Building schemas..."
(cd "$ROOT/contracts" && cargo odra schema)

if compgen -G "$SCHEMA_DIR/*_schema.json" > /dev/null; then
  node "$ROOT/scripts/generate-ts-types.mjs"
else
  echo "WARN: no schema JSON in $SCHEMA_DIR — writing stub exports"
  cat > "$OUT/src/index.ts" <<'EOF'
/** Auto-generated MERIDIAN contract type stubs. Re-run scripts/generate-abi.sh after schema build. */
export type ContractHash = `hash-${string}`;
export type PackageHash = `contract-package-${string}`;

export interface DeployedContracts {
  ComplianceRegistry: { package_hash: PackageHash };
  MeridianToken: { package_hash: PackageHash };
  StakingVault: { package_hash: PackageHash };
  YieldDistributor: { package_hash: PackageHash };
  MeridianAudit: { package_hash: PackageHash };
}
EOF
fi

echo "TypeScript types at $OUT"
