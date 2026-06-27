# MERIDIAN x402 Facilitator

Casper-native x402 facilitator and resource server for testnet CSPR micropayments.

## Modes

| `X402_MODE` | Port | Endpoints |
| --- | --- | --- |
| `facilitator` | 3001 | `/health`, `/metrics`, `/supported`, `/verify`, `/settle` |
| `resource` | 3003 | `/api/yield-rate`, `/api/validator-performance`, `/api/sanctions-merkle` |

## Payment flow

1. Client requests paid resource → `402` + `PaymentRequired`
2. Client signs authorization hash (`SHA-256` over canonical JSON + domain `casper-test:x402`)
3. `POST /verify` — signature, policy, replay (Upstash), time window
4. `POST /settle` — submits native CSPR `TransactionV1` via `casper-js-sdk@5.0.12`

## Run

```bash
pnpm --filter @meridian/casper-sdk run build
pnpm --filter @meridian/x402-facilitator run build

X402_MODE=facilitator node x402-facilitator/dist/index.js
X402_MODE=resource node x402-facilitator/dist/index.js
```

## Smoke test

```bash
set -a && source .env && set +a
node x402-facilitator/scripts/smoke-settle.mjs
node x402-facilitator/scripts/load-test.mjs
```

**Note:** Settlements require a funded main purse on the payer key (`ODRA_CASPER_LIVENET_SECRET_KEY_PATH`). Minimum native transfer on testnet is **2.5 CSPR** (`2500000000` motes) plus gas.

## References

- [odradev/casper-x402-poc](https://github.com/odradev/casper-x402-poc) — verify/settle API shape
- [casper-js-sdk NativeTransferBuilder](https://casper-ecosystem.github.io/casper-js-sdk/builders/NativeTransferBuilder)
