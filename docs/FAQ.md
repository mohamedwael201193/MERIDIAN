# FAQ

## Why is APY 0%?

No indexed staking distributions yet. `get_yield_rate` returns live indexer data — currently `estimatedApyBps: 0`.

## Why /dashboard/staking 404?

Use **/staking**. Redirects from `/dashboard/*` are configured after latest deploy.

## Minimum stake?

**500 CSPR** (500000000000 motes) for native `delegate_stake`. Enforced before wallet popup.

## issue_token?

Removed. MRWA is fixed-supply at deployment. Use `transfer_token`.

## delegate_stake vs deposit_to_vault?

- **delegate_stake** — native Casper delegation from your wallet
- **deposit_to_vault** — MERIDIAN StakingVault payable deposit

## MCP not connecting?

1. Check https://meridian-mcp-server-94q4.onrender.com/health
2. Render cold start: wait 30–60s
3. Copy config from /start page

## Planner traces empty?

Backend needs migration `008_create_agent_traces.sql`. Run migrate on Render if traces fail.

## Where to sign transactions?

/staking or /mcp or /playground with wallet connected.
