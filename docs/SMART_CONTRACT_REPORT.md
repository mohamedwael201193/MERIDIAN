# Smart Contract Report

**Source:** `deployed/addresses.json`  
**Network:** `casper-test`

## Deployed contracts

| Contract           | Contract hash        | Package hash                     | Entrypoints used by MERIDIAN               |
| ------------------ | -------------------- | -------------------------------- | ------------------------------------------ |
| ComplianceRegistry | `hash-e6ed2d2e…84f8` | `contract-package-e6ed2d2e…84f8` | `register_holder`, `revoke`                |
| MeridianToken      | `hash-9bcac97d…a2ca` | `contract-package-9bcac97d…a2ca` | `transfer`                                 |
| StakingVault       | `hash-3062ba32…00c7` | `contract-package-3062ba32…00c7` | `deposit`, `restake`, `distribute_rewards` |
| YieldDistributor   | `hash-378bf2fd…6c34` | `contract-package-378bf2fd…6c34` | Indexed reads                              |
| MeridianAudit      | `hash-1d8bc0bb…3d84` | `contract-package-1d8bc0bb…3d84` | Audit index / x402                         |

Explorer base: `https://testnet.cspr.live/contract/<hash>`

## Write entrypoints (tx-builder)

### ComplianceRegistry.register_holder

- **Args:** `addr` (Key), `attestation` (ByteArray)
- **Gas:** 5 CSPR payment amount (`5_000_000_000` motes)
- **Role:** Issuer attestation required on-chain
- **State change:** Holder registered in registry
- **Build status:** PASS (local)

### ComplianceRegistry.revoke

- **Args:** `addr`, `reason` (String)
- **Gas:** 50 CSPR
- **Role:** COMPLIANCE_OFFICER
- **Build status:** PASS (local)

### MeridianToken.transfer

- **Args:** `recipient` (Key), `amount` (UInt256)
- **Gas:** 5 CSPR
- **State change:** MRWA balance transfer
- **Build status:** PASS (local)

### StakingVault.deposit

- **Args:** none (payable)
- **Gas:** 50 CSPR + attached `amount` motes
- **State change:** CSPR in vault
- **Build status:** PASS (prod)

### StakingVault.restake

- **Args:** `from`, `to` (PublicKey), `amount` (UInt512)
- **Gas:** 50 CSPR
- **Role:** VALIDATOR_CURATOR
- **Build status:** PASS (prod)

### Native delegate (not a contract)

- **Builder:** `NativeDelegateBuilder`
- **Min:** 500 CSPR (`MIN_DELEGATION_MOTES`)
- **State change:** Delegation to validator
- **Build status:** PASS (prod)

## Verification deploy txs

From `addresses.json` `transaction_hashes`:

| Label                     | Hash            |
| ------------------------- | --------------- |
| deploy_ComplianceRegistry | `930efed7…1bd8` |
| deploy_MeridianToken      | `ca4c4b96…cc74` |
| wire_register_holder      | `7c6a4766…ad15` |

## State change investigation

| Symptom                               | Cause                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------- |
| Yield shows 0% APY, 0 staked          | No vault deposits / distributions on testnet yet — read data is real, not simulated |
| Compliance unchanged after "register" | Prod planner never built `register_holder` tx                                       |
| UI showed Confirmed without tx        | UI bug (fixed) — not a contract issue                                               |

## RPC

- Backend: `CasperRpcClient` for validators + tx submit proxy
- Frontend submit: `createCasperRpcClient()` in `/api/transactions/submit`
- Indexer lag: backend polls CSPR.cloud — may trail chain by ~88k blocks (documented in prior QA)

## Gas summary

| Operation        | Payment (motes)                 |
| ---------------- | ------------------------------- |
| register_holder  | 5,000,000,000                   |
| transfer_token   | 5,000,000,000                   |
| revoke_holder    | 50,000,000,000                  |
| deposit_to_vault | 50,000,000,000 + attached value |
| restake          | 50,000,000,000                  |
| delegate_stake   | 5,000,000,000                   |

See `docs/GAS_ANALYSIS.md` for full breakdown.
