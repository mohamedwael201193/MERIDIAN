# Judge Demo Script

**Duration:** 60 seconds understand · 5 minutes full flow

## Before demo

- Cursor or Claude with MERIDIAN MCP configured (`/start` page)
- Casper Wallet on testnet, ≥505 CSPR
- Tabs: `/agents`, `/playground`, `/staking`

## Script

| #   | Say                              | Agent does                | Wallet? |
| --- | -------------------------------- | ------------------------- | ------- |
| 1   | "What is MRWA yield APY?"        | get_yield_rate            | No      |
| 2   | "List validators"                | list_validators           | No      |
| 3   | "Delegate 500 CSPR. My key is …" | delegate_stake            | **Yes** |
| 4   | Sign in Casper Wallet            | finalized on testnet      | —       |
| 5   | Show /agents timeline            | SSE traces                | No      |
| 6   | Optional: x402 audit             | subscribe_audit + payment | Yes     |

## Proof points

- MCP is the product (13 tools, /health)
- Dashboard is visualizer only
- Real transaction (user showed hash `75ed87fc…` finalized)
- Read-before-write agent discipline

## URLs

- Start: https://meridian-frontend-kappa.vercel.app/start
- Playground: https://meridian-frontend-kappa.vercel.app/playground
- Staking: https://meridian-frontend-kappa.vercel.app/staking
