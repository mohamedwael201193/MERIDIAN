# AI Capabilities

MERIDIAN MCP exposes **13 tools** to Claude, Cursor, and any MCP client.

## Read (6) — no wallet

| Tool                  | Capability                            |
| --------------------- | ------------------------------------- |
| get_token_info        | Contract addresses + MRWA metadata    |
| get_yield_rate        | APY, total staked                     |
| get_holder_yield      | Distribution history                  |
| get_compliance_status | Holder registry status                |
| list_validators       | Live Casper validators                |
| subscribe_audit       | Audit feed (402 without x402 payment) |

## Write (7) — wallet signature

| Tool               | Capability                       |
| ------------------ | -------------------------------- |
| transfer_token     | MRWA transfer                    |
| register_holder    | Compliance registration          |
| revoke_holder      | Compliance officer revocation    |
| delegate_stake     | Native delegation (min 500 CSPR) |
| deposit_to_vault   | MERIDIAN vault deposit           |
| restake            | Curator vault restake            |
| distribute_rewards | Vault era distribution           |

## Agent layers

| Layer                      | Role                                      |
| -------------------------- | ----------------------------------------- |
| Planner Agent              | Objective → tool selection → traces       |
| Yield / Compliance / Audit | Autonomous decisions + adversarial review |
| x402                       | Machine micropayments                     |
| SSE timeline               | Live visualizer feed                      |

## Discipline

- Read before write
- Minimum 500 CSPR before delegate_stake wallet
- Non-custodial: MCP never holds user keys
