# MERIDIAN_ENGINEERING_BIBLE.md

> **Engineering Knowledge Base — File 3 of 4**
> **Purpose:** Specialize everything for MERIDIAN. Architecture review, ADRs, dependency/integration/contract matrices, sequence diagrams, deployment/rollback/DR plans.
> **Scope:** Every contract, every backend service, every agent, every MCP tool, every AI workflow, every database table, every event, every API, every deployment step, every integration, every test, every monitoring strategy, every security measure.
> **Verification date:** 2026-06-28

---

## HOW TO USE THIS FILE

This file specializes the Casper Protocol Bible and Casper Developer Bible for MERIDIAN. Every architectural decision is documented as an Architecture Decision Record (ADR). Every contract, service, agent, and tool is specified in detail. Every integration is mapped in a matrix.

---

## §1. MERIDIAN ARCHITECTURE REVIEW

### 1.1 Original Architecture (from Strategy Dossier)

MERIDIAN's original architecture (from the strategy dossier) specified:
- 4 Odra contracts: MeridianToken, StakingVault, ComplianceRegistry, YieldDistributor
- 3 AI agents: YieldAgent, ComplianceAgent, AuditAgent
- 1 MCP server (12 tools)
- 1 x402 facilitator (forked from odradev/casper-x402-poc)
- 1 backend (Node.js + Fastify + PostgreSQL + Redis)
- 1 frontend (Next.js 16 + Tailwind 4 + shadcn/ui)

### 1.2 Audit Findings (18 corrections, NO design changes)

The audit (per `CASPER_PROTOCOL_BIBLE.md` §1.9 and the latest-versions-verification research) identified 18 corrections, all of which are API reference updates — NOT design changes:

| # | Finding | Correction |
|---|---|---|
| A | Use `TransactionV1`, NOT `Deploy` | All Rust pseudocode + TS agents + frontend must use TransactionV1Builder |
| B | Use `runtime::call_subcall` for cross-contract calls | StakingVault uses call_subcall (not legacy call_contract) |
| C | Do NOT hardcode system auction hash | Use `system::get_auction()` at runtime |
| D | Use `casper-client` v5.0.1, NOT `casper-rust-sdk` | The latter is WIP with zero releases |
| E | Do NOT use `@toruslabs/casper-js-sdk` | Use official `casper-js-sdk` v5.0.12 |
| F | Use CEP-18 v1.2.0 and CEP-78 v1.5.1+ | Earlier versions not Casper 2.0-compatible |
| G | Use CSPR.click v1.9.0+, NOT direct Casper Wallet | Direct integration deprecated |
| H | Use `casper-eip-712` v1.2.0 with `casper-native` feature | Required for Ed25519 host verification |
| I | Era is 32 min (240 blocks × 8s) | YieldDistributor computes era from block_height |
| J | `delegate` costs 2.5 CSPR (fixed) | Gas analysis must account for this |
| K | CEP-90 forced undelegation is a real risk | YieldAgent validator whitelist must exclude unstable validators |
| L | Pin `odra = "=2.8.1"`, `cargo-odra = "0.1.7"` | With `--locked` |
| M | Rust 1.85+ stable, target `wasm32-unknown-unknown` | rust-toolchain.toml |
| N | Use `just` (not `make`) | `cargo install just --locked` |
| O | Casper Sidecar is REST-only | Never point casper-client at Sidecar |
| P | StakingVault uses deposit pattern (contract's own main purse) | User deposits CSPR into vault; vault delegates on its own behalf |
| Q | Era boundary detection via Sidecar SSE | Backend subscribes to block_finalized events |
| R | `PricingMode::Prepaid` is future (Manifest Tier 2) | Do NOT implement gasless flows in hackathon build |

### 1.3 Verdict

**The MERIDIAN architecture is fundamentally sound.** All 18 findings are corrections to API references, not design changes. The central thesis — "the first protocol where any RWA token natively earns Casper staking yield through AI-managed ERC-3643-compliant contracts that call the system auction directly" — is verified, mainnet-live, and supported by working reference implementations.

**Additional contract added during audit**: MeridianAudit (5th contract) — stores AuditAgent summary hashes. Originally implicit; now explicit.

---

## §2. ARCHITECTURE DECISION RECORDS (ADRs)

### ADR-001: Use Odra 2.8.1 as Smart Contract Framework

**Status:** Accepted
**Date:** 2026-06-28
**Context:** MERIDIAN needs a smart contract framework that supports Casper 2.0 TransactionV1, native CEP-88 events, contract upgradeability, and AI-discoverable docs.
**Decision:** Use Odra 2.8.1 ("Cape Verde") with `cargo-odra` v0.1.7.
**Rationale:**
- Odra is the only mature smart contract framework for Casper.
- v2.8.1 supports Casper 2.0 TransactionV1.
- v2.8.0 moved Ed25519 verification to host (PR #650), shrinking `proxy_caller.wasm` from 184 KB → 41 KB.
- `llms.txt` enables AI agents to autonomously generate working contracts.
- Modules library (Ownable, AccessControl, Pausable, ReentrancyGuard) provides OpenZeppelin-equivalent primitives.
**Alternatives considered:**
- Raw `casper-contract` SDK: too low-level; missing module library.
- Casper 1.x contract patterns: deprecated.
**Consequences:**
- All contracts must use `#[odra::module]` macro.
- `cargo-odra` is versioned separately from `odra` framework — pin both.
**References:**
- <https://odra.dev/docs>
- <https://github.com/odradev/odra>

### ADR-002: Use Contract Access to Auction for Native Yield

**Status:** Accepted
**Date:** 2026-06-28
**Context:** MERIDIAN's central thesis requires smart contracts to stake CSPR natively and earn validator rewards.
**Decision:** StakingVault calls `runtime::call_subcall(system::get_auction(), auction::METHOD_DELEGATE, args)` with `delegator = self.env().self_public_key()`.
**Rationale:**
- Contract Access to Auction is live on Casper 2.0 mainnet since 6 May 2025.
- Halborn-audited.
- Working reference impl in `casper-network/casper-node/smart_contracts/contracts/client/delegate/src/main.rs`.
- Casper-unique capability: no other major L1 ships this.
**Alternatives considered:**
- Off-chain orchestration: breaks composability, requires trust in relayer.
- LST intermediary (e.g., Lido): third-party risk, not native protocol yield.
**Consequences:**
- StakingVault uses deposit pattern (user deposits CSPR into vault; vault delegates on its own behalf).
- CEP-90 forced undelegation risk must be mitigated (validator whitelist).
**References:**
- <https://docs.casper.network/condor/index>
- <https://github.com/casper-network/casper-node/blob/dev/smart_contracts/contracts/client/delegate/src/main.rs>

### ADR-003: Use 3-Agent Swarm (Not Single LLM)

**Status:** Accepted
**Date:** 2026-06-28
**Context:** MERIDIAN requires AI management of staking, compliance, and audit. A single LLM creates three compounding failure modes: context pollution, prompt injection, single-vendor outage.
**Decision:** Use 3 specialized agents:
- YieldAgent (Claude Sonnet 4.5 primary, GPT-4o fallback)
- ComplianceAgent (GPT-4o primary, Claude Sonnet 4.5 fallback)
- AuditAgent (Gemini 2.5 Flash primary, Claude Haiku fallback)
**Rationale:**
- 3 different LLM providers eliminate single-vendor risk.
- Specialization reduces context pollution.
- Adversarial verification (AuditAgent reviews YieldAgent decisions) catches hallucinations.
**Alternatives considered:**
- Single LLM with multiple roles: context pollution, single point of failure.
- 5+ agents: operational complexity without proportional benefit.
**Consequences:**
- 3 separate TypeScript services to operate.
- 3 separate API keys to manage.
- Adversarial verification adds ~1s latency to YieldAgent decisions.
**References:**
- Vouch hackathon submission (adversarial verification pattern)
- Casper AI Toolkit: <https://www.casper.network/ai>

### ADR-004: Use ERC-3643 + Native Yield Extension

**Status:** Accepted
**Date:** 2026-06-28
**Context:** MERIDIAN targets institutional RWA market. Need a compliance-embedded token standard.
**Decision:** MeridianToken extends CEP-18 v1.2.0 with ERC-3643 compliance hooks + `accrue_yield()` extension.
**Rationale:**
- ERC-3643 is the institutional-grade RWA standard (Tokeny T-REX).
- Casper joined ERC3643 Association in October 2025.
- CEP-18 v1.2.0 is Casper 2.0-compatible.
- Native yield extension is Casper-unique (impossible on Ethereum/Solana).
**Alternatives considered:**
- Plain CEP-18: no compliance hooks.
- ERC-20 (when EVM ships): not yet live on Casper.
**Consequences:**
- MeridianToken has more entry points than plain CEP-18.
- ComplianceRegistry must be deployed before MeridianToken.
**References:**
- <https://www.erc3643.org>
- <https://www.casper.network/news/casper-network-joins-erc-3643>
- <https://github.com/casper-ecosystem/cep18>

### ADR-005: Use CEP-88 Native Events for Audit Trail

**Status:** Accepted
**Date:** 2026-06-28
**Context:** Every agent decision must be cryptographically verifiable on-chain.
**Decision:** Use CEP-88 native events (via `casper-event-standard` v0.7.0) for every state change. Backend consumes via Sidecar SSE.
**Rationale:**
- CEP-88 is Casper 2.0 native (replaces legacy CES).
- Merkle proofs enable verification without trusting indexer.
- Sidecar SSE enables sub-second event delivery.
**Alternatives considered:**
- Legacy CES: deprecated for new contracts.
- Custom event log: reinventing the wheel.
**Consequences:**
- Every state-changing entry point must emit a CEP-88 event BEFORE the state change.
- Backend must subscribe to Sidecar SSE filtered by contract_package_hash.
**References:**
- <https://docs.casper.network/condor/index>
- <https://github.com/make-software/casper-event-standard>

### ADR-006: Use CSPR.click v1.9.0+ for Wallet Integration

**Status:** Accepted
**Date:** 2026-06-28
**Context:** Frontend needs wallet integration. Direct Casper Wallet integration is deprecated.
**Decision:** Use `@make-software/csprclick-sdk` v1.9.0 and `@make-software/csprclick-react` v1.9.0.
**Rationale:**
- CSPR.click unifies Casper Wallet, Ledger, MetaMask Snap.
- v1.9.0 added `onStatusUpdate` WebSocket for live transaction status.
- Direct Casper Wallet integration is deprecated.
**Alternatives considered:**
- Direct `@make-software/casper-wallet`: deprecated.
- Casper Signer: deprecated (replaced by Casper Wallet).
**Consequences:**
- All wallet interactions go through CSPR.click SDK.
- `onStatusUpdate` callback required for live status.
**References:**
- <https://docs.cspr.click>
- <https://docs.cspr.click/documentation/changelog>

### ADR-007: Use casper-eip-712 v1.2.0 for Gasless Meta-Tx + x402

**Status:** Accepted
**Date:** 2026-06-28
**Context:** x402 facilitator needs EIP-712 typed-data signing. Future gasless flows need Permit pattern.
**Decision:** Use `casper-eip-712` v1.2.0 with `casper-native` feature (requires `casper-types = "7"`).
**Rationale:**
- v1.2.0 added `casper-native` feature for Ed25519 host verification.
- Implements `TransferAuthorization` (EIP-3009 pattern) used by x402.
- Implements `Permit` (EIP-2612 pattern) for future gasless flows.
**Alternatives considered:**
- Custom EIP-712 implementation: reinventing the wheel, error-prone.
**Consequences:**
- `casper-types = "7"` required in dependency tree.
- Domain separator must use CAIP-2 chainId format.
**References:**
- <https://github.com/casper-ecosystem/casper-eip-712>

### ADR-008: Use Non-Custodial MCP Server Pattern

**Status:** Accepted
**Date:** 2026-06-28
**Context:** Meridian MCP server will be publicly hosted. Must not hold private keys.
**Decision:** Write tools return unsigned TransactionV1 JSON; caller signs locally (via CSPR.click or casper-client); caller submits via separate `submit_transaction` tool.
**Rationale:**
- CSPR.trade MCP (MAKE) uses this pattern; production-proven.
- Public server never holds private keys — cannot be a honeypot.
**Alternatives considered:**
- Custodial server (Tairon pattern): public exposure is a security risk.
**Consequences:**
- Two-step workflow for write tools (build + sign + submit).
- ClawHub skill must teach this workflow.
**References:**
- <https://github.com/make-software/cspr-trade-mcp>
- <https://github.com/Tairon-ai/casper-network-mcp>

### ADR-009: Use Adversarial Verification for YieldAgent Decisions

**Status:** Accepted
**Date:** 2026-06-28
**Context:** YieldAgent makes financial decisions (restake). LLM hallucinations could cost yield.
**Decision:** AuditAgent (different LLM) independently reviews every YieldAgent restake decision before it commits. Disagreement blocks the action + triggers Telegram alert.
**Rationale:**
- Vouch hackathon submission demonstrated this pattern.
- Two-LLM verification catches hallucinations that single-LLM cannot.
**Alternatives considered:**
- Single-LLM with self-review: same model, same biases.
- Human-in-the-loop for every restake: defeats autonomy.
**Consequences:**
- ~1s added latency to YieldAgent decisions.
- Disagreement rate must be monitored (high rate indicates prompt issue).
**References:**
- Vouch hackathon submission (adversarial verification)

### ADR-010: Use 24-Hour Timelock on Governance Actions

**Status:** Accepted
**Date:** 2026-06-28
**Context:** Compliance rule changes, role revocations, contract upgrades can affect holders. Need to give holders time to exit.
**Decision:** 24-hour timelock on:
- ComplianceRules updates
- Role revocations (bulk)
- Contract upgrades
**Rationale:**
- Standard DeFi governance pattern.
- Gives holders time to exit before adverse changes.
**Alternatives considered:**
- No timelock: compromised deployer can rug.
- 7-day timelock: too slow for emergency compliance actions.
**Consequences:**
- Emergency actions (e.g., sanctions revocation) cannot bypass timelock.
- Holders can exit via transfer during timelock window.
**References:**
- DeFi governance best practices.

### ADR-011: Use PostgreSQL for Event Indexing (Not MongoDB)

**Status:** Accepted
**Date:** 2026-06-28
**Context:** Backend needs to index CEP-88 events for API queries.
**Decision:** PostgreSQL 15+ with 5 migrations (tokens, holders, distributions, events, audit_summaries).
**Rationale:**
- Relational model fits Casper's event structure (emitter, topic, index, payload).
- ACID guarantees for financial data.
- Sidecar uses PostgreSQL as its backend (same ecosystem).
**Alternatives considered:**
- MongoDB: less suitable for relational financial data.
- SQLite: not production-grade for concurrent access.
**Consequences:**
- Schema migrations required.
- SQL parameterization mandatory (no string concatenation).
**References:**
- <https://github.com/casper-network/casper-sidecar> (uses PostgreSQL)

### ADR-012: Use Sidecar SSE for Event Consumption (Not Polling)

**Status:** Accepted
**Date:** 2026-06-28
**Context:** Backend needs real-time event delivery.
**Decision:** Subscribe to Sidecar SSE (`/events/stream`) with exponential backoff reconnect + backfill.
**Rationale:**
- SSE is sub-second; polling is 2-5 seconds.
- Sidecar SSE supports filtering by contract_package_hash.
**Alternatives considered:**
- Polling: slower, higher CSPR.cloud load.
- Direct node SSE: requires running own node.
**Consequences:**
- Must implement reconnect + backfill (Sidecar disconnects happen).
- Must use `block_height + event_index` as monotonic key.
**References:**
- <https://docs.casper.network/operators/setup/casper-sidecar>
- <https://docs.casper.network/developers/dapps/monitor-and-consume-events>

### ADR-013: Use Cloudflare Workers for Agent Hosting

**Status:** Accepted
**Date:** 2026-06-28
**Context:** 3 AI agents need hosting. Edge deployment reduces latency.
**Decision:** Cloudflare Workers for agent hosting. Redis pub/sub for inter-agent communication.
**Rationale:**
- 50ms cold-start.
- Edge deployment (close to CSPR.cloud).
- Workers secrets for key management.
**Alternatives considered:**
- AWS Lambda: slower cold-start.
- Self-hosted VPS: operational burden.
**Consequences:**
- Workers have execution time limits (50ms CPU, but can await up to 30s for I/O).
- Workers secrets for key storage (not env vars in traditional sense).
**References:**
- <https://developers.cloudflare.com/workers>

### ADR-014: Use x402 for Agent-to-Agent Micropayments

**Status:** Accepted
**Date:** 2026-06-28
**Context:** MERIDIAN needs to monetize yield data queries from external agents.
**Decision:** Fork `odradev/casper-x402-poc`, customize to settle payments to Meridian treasury. Read tools (get_yield_rate, subscribe_audit) are x402-gated (0.01 CSPR per call).
**Rationale:**
- x402 is HTTP-native; AI agents can pay per request.
- Casper is the first WASM-native L1 with live x402 on mainnet.
- Self-hosted facilitator (no third-party dependency).
**Alternatives considered:**
- Subscription model: friction for agents.
- Free queries: no revenue, no Sybil resistance.
**Consequences:**
- Fork + customize facilitator (operational burden).
- EIP-712 domain separator must use CAIP-2 chainId.
**References:**
- <https://github.com/odradev/casper-x402-poc>
- <https://www.casper.network/ai>

### ADR-015: Use 5 Odra Contracts (Not 4)

**Status:** Accepted (audit correction)
**Date:** 2026-06-28
**Context:** Original dossier specified 4 contracts. Audit added 5th (MeridianAudit).
**Decision:** 5 contracts: MeridianToken, StakingVault, ComplianceRegistry, YieldDistributor, MeridianAudit.
**Rationale:**
- MeridianAudit stores AuditAgent summary hashes on-chain.
- Separate contract keeps audit trail independent of main contract suite.
**Alternatives considered:**
- Store audit summaries in YieldDistributor: mixes concerns.
**Consequences:**
- Slightly more deployment complexity.
- Cleaner separation of concerns.
**References:**
- Audit findings in `CASPER_PROTOCOL_BIBLE.md` §1.9

---

## §3. DEPENDENCY MATRIX

| Dependency | Version | Purpose | Pin Reason |
|---|---|---|---|
| **Rust** | 1.85+ stable | Contract compilation | Required for `casper-contract` v7+ and Odra 2.8+ |
| **Rust target** | `wasm32-unknown-unknown` | WASM compilation | `wasm32-wasi` produces invalid Casper WASM |
| **`just`** | 1.40.0+ | Command runner | Odra + x402 use `justfile` |
| **`cargo-odra`** | 0.1.7 | Odra CLI | Separate versioning from `odra` framework |
| **`casper-client`** | 5.0.1 | Rust CLI for Casper 2.0 | v4.x incompatible with Casper 2.0 mainnet |
| **`casper-types`** | 7.0.0 | Rust types | Required by `casper-eip-712` v1.2.0 `casper-native` feature |
| **`casper-contract`** | 7.0.0 | Contract runtime macros | Casper 2.0 compatible |
| **`casper-event-standard`** | 0.7.0 | CEP-88 events | MAKE-maintained; current |
| **`casper-eip-712`** | 1.2.0 (+ `casper-native` feature) | EIP-712 signing | v1.2.0 added host verification |
| **`odra`** | 2.8.1 | Smart contract framework | v2.8.0+ has host-side Ed25519 verification |
| **`odra-modules`** | 2.8.1 | Odra module library | Match `odra` version |
| **`odra-casper-backend`** | 2.8.1 | Odra Casper backend | Match `odra` version |
| **`odra-casper-livenet-env`** | 2.8.1 | Livenet testing | Match `odra` version |
| **`casper-js-sdk`** | 5.0.12 (npm) | TypeScript SDK | v5.x is Casper 2.0 compatible |
| **`@make-software/csprclick-sdk`** | 1.9.0 (npm) | Wallet integration | v1.9.0+ has `onStatusUpdate` |
| **`@make-software/csprclick-react`** | 1.9.0 (npm) | React wrapper | Match SDK version |
| **Node.js** | 20 LTS+ | Backend + agents + MCP + frontend | LTS required for production |
| **PostgreSQL** | 15+ | Event indexing | Sidecar uses PostgreSQL |
| **Redis** | 7+ | Agent pub/sub | Standard for pub/sub |
| **Docker** | latest | x402 facilitator + nctl | Standard containerization |
| **`fastify`** | 4.28.1 | Backend framework | Current stable |
| **`@fastify/cors`** | 9.0.1 | CORS | Match Fastify |
| **`@fastify/rate-limit`** | 9.1.0 | Rate limiting | Match Fastify |
| **`@fastify/helmet`** | 11.0.0 | Security headers | Match Fastify |
| **`pg`** | 8.12.0 | PostgreSQL client | Standard |
| **`ioredis`** | 5.4.1 | Redis client | Standard |
| **`pino`** | 9.3.2 | Structured logging | Standard |
| **`prom-client`** | 15.1.3 | Prometheus metrics | Standard |
| **`zod`** | 3.23.8 | Schema validation | Standard |
| **`next`** | 16.0.0 | Frontend framework | Latest stable |
| **`react`** | 19.0.0 | UI library | Required by Next.js 16 |
| **`tailwindcss`** | 4.0.0 | CSS framework | Latest stable |
| **`@radix-ui/react-dialog`** | 1.1.1 | UI primitives | shadcn/ui dependency |
| **`recharts`** | 2.12.7 | Charting | Standard for React |
| **`swr`** | 2.2.5 | Data fetching | Standard for Next.js |
| **`@anthropic-ai/sdk`** | 0.27.3 | Claude API | Current |
| **`openai`** | 4.56.0 | GPT-4o API | Current |
| **`@google/generative-ai`** | 0.17.1 | Gemini API | Current |
| **`@playwright/test`** | 1.46.0 | E2E testing | Current |
| **`vitest`** | 2.0.5 | Unit testing | Current |
| **`typescript`** | 5.5.4 | TypeScript | Current |
| **`eslint`** | 9.9.0 | Linting | Current |

---

## §4. CONTRACT INTERACTION MATRIX

| From → To | MeridianToken | StakingVault | ComplianceRegistry | YieldDistributor | MeridianAudit | System Auction |
|---|---|---|---|---|---|---|
| **MeridianToken** | — | calls `accrue_yield()` on deposit | calls `is_compliant()` before transfer | — | — | — |
| **StakingVault** | calls `accrue_yield()` on rewards | — | — | calls `distribute()` on era boundary | — | calls `delegate()`, `undelegate()`, `redelegate()` via `runtime::call_subcall` |
| **ComplianceRegistry** | calls `revoke_holder()` on revoke | — | — | — | — | — |
| **YieldDistributor** | calls `balance_of()` | calls `claim_rewards()` | calls `is_compliant()` for each holder | — | — | — |
| **MeridianAudit** | — | — | — | — | — | — |
| **YieldAgent (off-chain)** | — | calls `restake()` (signed TransactionV1) | — | — | — | — |
| **ComplianceAgent (off-chain)** | subscribes to Transfer events | — | calls `revoke()`, `reinstate()` (signed TransactionV1) | — | — | — |
| **AuditAgent (off-chain)** | subscribes to all events | — | — | — | calls `submit_summary()` (signed TransactionV1) | — |

---

## §5. CONTRACT SPECIFICATIONS

### 5.1 MeridianToken (ERC-3643 + Native Yield Extension)

**File:** `contracts/meridian-token/src/lib.rs`
**Base:** CEP-18 v1.2.0
**Extensions:** ERC-3643 compliance hooks, `accrue_yield()` hook

**Entry points:**

| Entry Point | Access | Args | Returns | Events Emitted |
|---|---|---|---|---|
| `init` | deployer | `metadata: AssetMetadata`, `supply: U256`, `compliance: ComplianceRules`, `stake_amount: U512` | — | `TokenIssued` |
| `transfer` | public (with compliance check) | `to: Address`, `amount: U256` | `Result<(), Error>` | `Transfer` |
| `transfer_from` | public (with approval + compliance) | `from: Address`, `to: Address`, `amount: U256` | `Result<(), Error>` | `Transfer` |
| `balance_of` | public | `addr: Address` | `U256` | — |
| `approve` | public | `spender: Address`, `amount: U256` | — | `Approval` |
| `accrue_yield` | StakingVault only | `holder: Address`, `amount: U512` | — | `YieldAccrued` |
| `revoke_holder` | ComplianceRegistry only | `addr: Address` | — | `HolderRevoked` |
| `reinstate_holder` | ComplianceRegistry only | `addr: Address` | — | `HolderReinstated` |
| `upgrade` | issuer (24h timelock) | `new_code_hash: Hash` | — | `ContractUpgraded` |

**Events (CEP-88):**
- `TokenIssued { issuer, total_supply, initial_stake }`
- `Transfer { from, to, amount }`
- `Approval { owner, spender, amount }`
- `YieldAccrued { holder, amount, era }`
- `HolderRevoked { addr, reason }`
- `HolderReinstated { addr }`
- `ContractUpgraded { new_code_hash }`

### 5.2 StakingVault (Calls System Auction)

**File:** `contracts/staking-vault/src/lib.rs`
**Pattern:** Deposit pattern (contract's own main purse)

**Entry points:**

| Entry Point | Access | Args | Returns | Events Emitted |
|---|---|---|---|---|
| `init` | deployer | `token: Address`, `initial_stake: U512` | — | `VaultInitialized` |
| `deposit` | public | `amount: U512` | — | `DepositReceived`, `Staked` |
| `restake` | YieldAgent (VALIDATOR_CURATOR role) | `from: PublicKey`, `to: PublicKey`, `amount: U512` | — | `Restaked` |
| `undelegate` | YieldAgent | `validator: PublicKey`, `amount: U512` | — | `Undelegated` |
| `claim_rewards` | YieldDistributor only | — | `U512` | `RewardsClaimed` |
| `distribute_rewards` | YieldDistributor only | — | — | (calls YieldDistributor.distribute) |
| `set_validator_curator` | issuer (24h timelock) | `addr: Address` | — | `ValidatorCuratorChanged` |
| `get_validator` | public | — | `PublicKey` | — |
| `get_total_staked` | public | — | `U512` | — |
| `upgrade` | issuer (24h timelock) | `new_code_hash: Hash` | — | `ContractUpgraded` |

**Critical implementation detail:**
```rust
pub fn deposit(&mut self, amount: U512) {
    // User has transferred CSPR into this contract's main purse
    let caller = self.env().caller();
    
    // Emit event BEFORE state change
    casper_event_standard::emit(DepositReceived {
        depositor: caller,
        amount,
    });
    
    // Delegate on contract's own behalf
    let auction_hash = self.env().get_system_contract("auction");
    let args = runtime_args! {
        auction::ARG_DELEGATOR => self.env().self_public_key(),
        auction::ARG_VALIDATOR => self.get_validator(),
        auction::ARG_AMOUNT => amount,
    };
    self.env().call_contract(auction_hash, auction::METHOD_DELEGATE, args);
    
    // Update state
    self.total_staked.add(amount);
    
    // Mint MeridianToken to depositor
    let token_ref = MeridianTokenContract::at(self.token.get());
    token_ref.accrue_yield(caller, amount);
    
    casper_event_standard::emit(Staked {
        depositor: caller,
        validator: self.get_validator(),
        amount,
    });
}
```

### 5.3 ComplianceRegistry (ERC-3643 + AI Hooks)

**File:** `contracts/compliance-registry/src/lib.rs`

**Entry points:**

| Entry Point | Access | Args | Returns | Events Emitted |
|---|---|---|---|---|
| `init` | deployer | `rules: ComplianceRules` | — | `RegistryInitialized` |
| `register_holder` | issuer | `addr: Address`, `attestation: Attestation` | — | `HolderRegistered` |
| `revoke` | ComplianceAgent (COMPLIANCE_OFFICER role) | `addr: Address`, `reason: String` | — | `HolderRevoked` |
| `reinstate` | ComplianceAgent | `addr: Address` | — | `HolderReinstated` |
| `is_compliant` | public | `addr: Address` | `bool` | — |
| `get_attestation` | public | `addr: Address` | `Option<Attestation>` | — |
| `update_rules` | issuer (24h timelock) | `new_rules: ComplianceRules` | — | `RulesUpdated` |
| `set_compliance_officer` | issuer (24h timelock) | `addr: Address` | — | `ComplianceOfficerChanged` |

**ComplianceRules struct:**
```rust
pub struct ComplianceRules {
    pub max_holders: u32,
    pub jurisdictions: Vec<Country>,
    pub require_accreditation: bool,
    pub max_concentration_pct: u8,
    pub sanctions_check: bool,
}
```

### 5.4 YieldDistributor (Era-Based Distribution)

**File:** `contracts/yield-distributor/src/lib.rs`

**Entry points:**

| Entry Point | Access | Args | Returns | Events Emitted |
|---|---|---|---|---|
| `init` | deployer | `token: Address`, `vault: Address`, `treasury: Address` | — | `DistributorInitialized` |
| `distribute` | StakingVault only | `rewards: U512` | — | `YieldDistributed` (per holder) |
| `pending_yield` | public | `holder: Address` | `U512` | — |
| `set_protocol_fee_bps` | governance (24h timelock) | `bps: u16` | — | `ProtocolFeeChanged` |
| `upgrade` | issuer (24h timelock) | `new_code_hash: Hash` | — | `ContractUpgraded` |

**Distribution logic:**
```rust
pub fn distribute(&mut self, rewards: U512) {
    let caller = self.env().caller();
    assert_eq!(caller, self.vault.get(), "Only StakingVault can distribute");
    
    let token_ref = MeridianTokenContract::at(self.token.get());
    let registry_ref = ComplianceRegistryContract::at(self.compliance_registry.get());
    
    let total_supply = token_ref.total_supply();
    let protocol_fee = rewards * U512::from(self.protocol_fee_bps.get()) / U512::from(10000);
    let distributable = rewards - protocol_fee;
    
    // Iterate qualified holders
    for holder in self.holders.iter() {
        if registry_ref.is_compliant(*holder) {
            let balance = token_ref.balance_of(*holder);
            let share = distributable * balance / total_supply;
            // Transfer CSPR to holder
            self.env().transfer_cspr(*holder, share);
            casper_event_standard::emit(YieldDistributed {
                holder: *holder,
                amount: share,
                era: self.env().current_era(),
            });
        }
    }
    
    // Accrue non-compliant shares to treasury
    let treasury = self.treasury.get();
    self.env().transfer_cspr(treasury, protocol_fee);
}
```

### 5.5 MeridianAudit (Audit Summary Storage)

**File:** `contracts/meridian-audit/src/lib.rs`

**Entry points:**

| Entry Point | Access | Args | Returns | Events Emitted |
|---|---|---|---|---|
| `init` | deployer | — | — | `AuditInitialized` |
| `submit_summary` | AuditAgent (AUDIT_SIGNER role) | `summary_hash: Hash`, `summary_payload: Bytes` | — | `AuditSummarySubmitted` |
| `get_summary` | public | `summary_hash: Hash` | `Option<Bytes>` | — |
| `get_latest_summaries` | public | `count: u32` | `Vec<Hash>` | — |
| `set_audit_signer` | issuer (24h timelock) | `addr: Address` | — | `AuditSignerChanged` |
| `upgrade` | issuer (24h timelock) | `new_code_hash: Hash` | — | `ContractUpgraded` |

---

## §6. BACKEND SERVICE SPECIFICATIONS

### 6.1 Backend API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/health` | GET | none | Health check (PostgreSQL + Redis + Sidecar + RPC) |
| `/metrics` | GET | none | Prometheus metrics |
| `/api/tokens` | GET | API key | List all issued MeridianTokens |
| `/api/tokens/:id` | GET | API key | Get token details |
| `/api/tokens/:id/yield` | GET | API key | Get current APY |
| `/api/tokens/:id/yield-history` | GET | API key | Get era-by-era yield history |
| `/api/tokens/:id/stake` | GET | API key | Get current stake info |
| `/api/tokens/build-issue` | POST | API key | Build unsigned issue transaction |
| `/api/tokens/submit` | POST | API key | Submit signed transaction |
| `/api/holders/:address` | GET | API key | Get holder info |
| `/api/holders/:address/compliance` | GET | API key | Get compliance status |
| `/api/holders/:address/yield` | GET | API key | Get pending yield |
| `/api/distributions/:token_id` | GET | API key | Get distribution history |
| `/api/audit/summaries` | GET | API key | Get audit summaries |
| `/api/audit/subscribe` | GET (SSE) | API key + x402 | Subscribe to audit event stream |

### 6.2 Database Tables

(See `CASPER_DEVELOPER_BIBLE.md` §11 for full SQL migrations)

| Table | Purpose |
|---|---|
| `tokens` | Issued MeridianTokens |
| `holders` | Holder compliance attestations |
| `distributions` | Era-based yield distributions |
| `events` | CEP-88 events indexed from Sidecar |
| `audit_summaries` | AuditAgent summary hashes |

### 6.3 Event Listener

(See `CASPER_DEVELOPER_BIBLE.md` §11.2 for full implementation)

- Subscribes to Sidecar SSE filtered by MeridianToken contract_package_hash.
- Exponential backoff reconnect (1s, 2s, 4s, ..., max 60s, max 30 attempts).
- Backfill on reconnect using `block_height` as cursor.
- Monotonic ordering via `block_height + event_index`.

---

## §7. AGENT SPECIFICATIONS

### 7.1 YieldAgent

**Model:** Claude Sonnet 4.5 (primary), GPT-4o (fallback)
**Trigger:** Era boundary (every 32 min)
**Key:** Ed25519, registered as `validator_curator` in StakingVault
**Workflow:**
1. Read StakingVault state via MCP (current validators, APYs, era rewards).
2. Read external validator performance feed (via x402 micropayment to third-party validator-monitoring agent).
3. Compute optimal validator mix (maximize APY subject to: max 30% per validator, min 5 validators, avoid >5% commission, avoid <99% uptime).
4. Compare to current allocation. If drift > 50 bps, produce restake plan.
5. Submit restake transaction via MCP (signed by StakingVault curator key).
6. Emit CEP-88 event: `Restaked`.
7. Wait one era. Repeat.

**Adversarial verification:** Every restake decision independently reviewed by AuditAgent before commit. Disagreement blocks + Telegram alert.

### 7.2 ComplianceAgent

**Model:** GPT-4o (primary), Claude Sonnet 4.5 (fallback)
**Trigger:** Event-driven (on Transfer event from MeridianToken)
**Key:** Ed25519, registered as `compliance_officer` in ComplianceRegistry
**Workflow:**
1. Subscribe to Transfer events on MeridianToken (via CSPR.cloud SSE).
2. On new transfer, fetch recipient attestation from ComplianceRegistry.
3. Cross-check recipient against: OFAC SDN list, EU consolidated list, issuer custom blocklist, issuer jurisdiction rules.
4. If match: call `ComplianceRegistry.revoke(addr, reason)`. Emit CEP-88 event.
5. If no match but attestation expired: flag for human review (Telegram alert).
6. Continuous re-screen: every holder re-checked every 7 days.

### 7.3 AuditAgent

**Model:** Gemini 2.5 Flash (primary), Claude Haiku (fallback)
**Trigger:** Hourly batch + adversarial verification on every YieldAgent decision
**Key:** Ed25519, registered as `audit_signer` in MeridianAudit
**Workflow:**
1. Pull all CEP-88 events from last hour.
2. Group by event type. Generate structured audit summary.
3. Sign summary with AuditAgent key.
4. Submit to MeridianAudit contract.
5. Expose summary via MCP `subscribe_audit` tool (x402-gated).

**Adversarial verification loop:**
1. YieldAgent posts restake proposal to Redis pub/sub `meridian.yield.proposal`.
2. AuditAgent reads proposal, independently verifies (using different LLM).
3. If AuditAgent agrees: YieldAgent proceeds.
4. If AuditAgent disagrees: YieldAgent blocks, Telegram alert to operator.

---

## §8. MCP SERVER SPECIFICATIONS

### 8.1 Tool Inventory (12 tools)

**Read tools (6):**

| Tool | x402-gated | Purpose |
|---|---|---|
| `get_token_info` | No | Token metadata, total supply, current stake, APY |
| `get_yield_rate` | Yes (0.01 CSPR) | Current era effective APY |
| `get_holder_yield` | Yes (0.01 CSPR) | Pending yield for specific holder |
| `get_compliance_status` | Yes (0.01 CSPR) | Compliance attestation + revocation history |
| `subscribe_audit` | Yes (0.01 CSPR/stream) | CEP-88 audit event stream |
| `list_validators` | No | YieldAgent validator whitelist |

**Write tools (6, non-custodial — return unsigned TransactionV1):**

| Tool | Purpose |
|---|---|
| `issue_token` | Deploy new MeridianToken (issuer only) |
| `transfer_token` | Transfer MeridianToken with compliance check |
| `register_holder` | Add holder + attestation to ComplianceRegistry |
| `revoke_holder` | Revoke holder (ComplianceAgent only) |
| `restake` | Trigger YieldAgent restake (curator only) |
| `distribute_rewards` | Manually trigger YieldDistributor (governance only) |

### 8.2 ClawHub Skill

**File:** `mcp-server/src/clawhub-skill/SKILL.md`
**Install:** `npx clawhub@latest install meridian-mcp`

Skill teaches the agent the workflow: read token info → check compliance → build transfer → sign locally → submit.

---

## §9. x402 FACILITATOR SPECIFICATIONS

### 9.1 Three x402 Loops

**Loop 1 (Inbound): Consumer agents pay Meridian for yield data.**
- External portfolio agent calls `get_yield_rate` on Meridian MCP server.
- MCP server returns HTTP 402 with x402 payment instructions.
- Portfolio agent signs EIP-712 TransferAuthorization (0.01 CSPR to Meridian treasury).
- Facilitator verifies + settles on Casper Testnet.
- MCP server returns 200 OK with yield data.

**Loop 2 (Outbound): YieldAgent pays third-party validator monitors.**
- YieldAgent calls external validator-monitoring agent for performance data.
- Returns 402. YieldAgent signs EIP-712 (0.05 CSPR).
- Facilitator settles. YieldAgent receives performance data.
- YieldAgent uses data to make restake decision.

**Loop 3 (Operational): ComplianceAgent pays for sanctions list refresh.**
- ComplianceAgent calls external sanctions API agent for Merkle root refresh.
- Returns 402. ComplianceAgent signs EIP-712 (0.10 CSPR).
- Facilitator settles. ComplianceAgent receives Merkle root.
- ComplianceAgent stores root on-chain (cheap) + checks individual addresses off-chain.

### 9.2 Facilitator Customization

- Fork `odradev/casper-x402-poc`.
- Bump Odra from 2.7.1 → 2.8.1 (CEP-3009 nonce fix, CEP-95 security fix).
- Customize facilitator to settle payments to Meridian treasury.
- Use `casper-eip-712` v1.2.0 with `casper-native` feature.
- Set CAIP-2 chainId (`casper:casper-test` or `casper:casper`).
- Self-host via `just docker-up`.

---

## §10. SEQUENCE DIAGRAMS

### 10.1 Token Issuance Sequence

```
Issuer         Frontend         Backend         CSPR.click         Casper RPC         MeridianToken Contract
  |               |                |                 |                   |                      |
  |---fill form-->|                |                 |                   |                      |
  |               |---POST /api/tokens/build-issue->|                   |                      |
  |               |                |---build unsigned TransactionV1---->|                      |
  |               |<--unsigned tx--|                 |                   |                      |
  |               |---sign() via CSPR.click-------->|                   |                      |
  |               |                |                 |---open wallet---->|                      |
  |<--wallet prompt (user approves)                 |                   |                      |
  |               |                |                 |---signed tx----->|                      |
  |               |---POST /api/tokens/submit----->|                   |                      |
  |               |                |---put_transaction (signed)-------->|                      |
  |               |                |                 |                   |---call init()------>|
  |               |                |                 |                   |                      |---deploy StakingVault
  |               |                |                 |                   |                      |---call system auction delegate()
  |               |                |                 |                   |                      |---emit TokenIssued event
  |               |                |                 |                   |<--transaction hash--|
  |               |                |<--transaction hash|                 |                      |
  |               |<--tx hash------|                 |                   |                      |
  |               |---poll via onStatusUpdate------>|                   |                      |
  |               |                |                 |                   |                      |
  |               |                |---index event (via Sidecar SSE)---|                      |
  |               |                |---update DB     |                   |                      |
  |               |<--confirmed----|                 |                   |                      |
  |<--success UI--|                |                 |                   |                      |
```

### 10.2 Yield Distribution Sequence (Era Boundary)

```
Casper Node       Sidecar SSE         Backend Event Listener         YieldDistributor Contract         StakingVault         System Auction
  |                    |                          |                              |                              |                      |
  |---block_finalized->|                          |                              |                              |                      |
  |                    |---SSE event------------->|                              |                              |                      |
  |                    |                          |---compute era_id = block_height / 240                     |                      |
  |                    |                          |---if era_id incremented:    |                              |                      |
  |                    |                          |---call distribute()-------->|                              |                      |
  |                    |                          |                              |---call claim_rewards()----->|                      |
  |                    |                          |                              |                              |---call auction claim->|
  |                    |                          |                              |                              |<--rewards (CSPR)-----|
  |                    |                          |                              |<--rewards-------------------|                      |
  |                    |                          |                              |---for each qualified holder: |                      |
  |                    |                          |                              |    compute share              |                      |
  |                    |                          |                              |    transfer CSPR to holder   |                      |
  |                    |                          |                              |    emit YieldDistributed     |                      |
  |                    |                          |                              |---transfer protocol fee to treasury            |
  |                    |                          |<--transaction hash-----------|                              |                      |
  |                    |                          |---index YieldDistributed events (via Sidecar SSE)         |                      |
  |                    |                          |---update DB (distributions table)                         |                      |
```

### 10.3 Compliance Revocation Sequence

```
Attacker (sanctioned)     MeridianToken Contract         Sidecar SSE         ComplianceAgent         OFAC API         ComplianceRegistry
  |                              |                            |                      |                     |                      |
  |---attempt transfer---------->|                            |                      |                     |                      |
  |                              |---emit Transfer event----->|                      |                     |                      |
  |                              |                            |---SSE event-------->|                     |                      |
  |                              |                            |                      |---fetch recipient attestation----->|
  |                              |                            |                      |<--attestation------|                      |
  |                              |                            |                      |---check OFAC SDN list (cached)    |
  |                              |                            |                      |---MATCH FOUND--------|                      |
  |                              |                            |                      |---call revoke(addr, reason)------>|
  |                              |                            |                      |                     |                      |---emit HolderRevoked
  |                              |                            |                      |                     |                      |---flip recipient to "revoked"
  |                              |                            |                      |<--tx hash----------|                      |
  |                              |                            |                      |---Telegram alert to operator       |
  |                              |<--next transfer attempt reverts (compliance check fails)                  |
  |<--transfer reverted---------|                            |                      |                     |                      |
```

### 10.4 Adversarial Verification Sequence (YieldAgent Restake)

```
YieldAgent              Redis pub/sub              AuditAgent              Operator (Telegram)
  |                          |                          |                          |
  |---read StakingVault state (via MCP)                |                          |
  |---compute restake plan (via Claude Sonnet 4.5)     |                          |
  |---post proposal to meridian.yield.proposal-------->|                          |
  |                          |---read proposal-------->|                          |
  |                          |                          |---independent review (via Gemini)|
  |                          |                          |---decision: AGREE or DISAGREE    |
  |                          |<--decision---------------|                          |
  |<--decision---------------|                          |                          |
  |                          |                          |                          |
  |---if AGREE:              |                          |                          |
  |    sign TransactionV1    |                          |                          |
  |    submit to RPC         |                          |                          |
  |    emit Restaked event   |                          |                          |
  |                          |                          |                          |
  |---if DISAGREE:           |                          |                          |
  |    block restake         |                          |                          |
  |---post alert to meridian.operator.alert----------->|                          |
  |                          |---read alert------------>|                          |
  |                          |                          |---send Telegram alert-->|
  |                          |                          |                          |<--operator notified
```

### 10.5 x402 Inbound Payment Sequence

```
Portfolio Agent              Meridian MCP Server              x402 Facilitator              Casper Testnet
  |                                |                                |                            |
  |---get_yield_rate(token_id)---->|                                |                            |
  |                                |---check: no payment header     |                            |
  |<--402 Payment Required---------|                                |                            |
  |    (x402 metadata, 0.01 CSPR)  |                                |                            |
  |                                |                                |                            |
  |---sign EIP-712 TransferAuthorization (0.01 CSPR to Meridian treasury)                  |
  |---POST /settle (signature, public_key, typed_data)----------->|                            |
  |                                |                                |---verify signature         |
  |                                |                                |---submit transfer_with_auth->|
  |                                |                                |<--tx hash------------------|
  |<--{ settled: true, tx_hash }---|                                |                            |
  |                                |                                |                            |
  |---retry get_yield_rate (with payment proof)------------------>|                            |
  |<--200 OK + yield data----------|                                |                            |
```

---

## §11. EVENT FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CASPER BLOCKCHAIN                                    │
│                                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │ MeridianTok │  │ StakingVault│  │ Compliance  │  │   Yield     │  │ Audit  │ │
│  │   en        │  │             │  │ Registry    │  │ Distributor │  │        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───┬────┘ │
│         │                │                │                │              │      │
│         └────────────────┴────────────────┴────────────────┴──────────────┘      │
│                                    │                                              │
│                              CEP-88 Events                                        │
└────────────────────────────────────┬─────────────────────────────────────────────┘
                                     │
                                     ▼
                          ┌─────────────────────┐
                          │  Casper Sidecar     │
                          │  (REST + SSE)       │
                          └──────────┬──────────┘
                                     │ SSE stream
                                     ▼
                          ┌─────────────────────┐
                          │  Backend Event      │
                          │  Listener           │
                          │  (exponential       │
                          │  backoff +          │
                          │  backfill)          │
                          └──────────┬──────────┘
                                     │ INSERT
                                     ▼
                          ┌─────────────────────┐
                          │  PostgreSQL         │
                          │  (events table)     │
                          └──────────┬──────────┘
                                     │ SELECT
                                     ▼
                          ┌─────────────────────┐
                          │  Backend API        │
                          │  (Fastify)          │
                          └──────────┬──────────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                ┌─────────────────┐   ┌─────────────────┐
                │  Frontend       │   │  MCP Server     │
                │  (Next.js)      │   │  (12 tools)     │
                └─────────────────┘   └────────┬────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  External Agents    │
                                    │  (portfolio, risk)  │
                                    └─────────────────────┘
```

---

## §12. TRANSACTION LIFECYCLE

### 12.1 Token Issuance Transaction

1. **Build** (backend): `POST /api/tokens/build-issue` → unsigned TransactionV1 (SmartContract category, install WASM).
2. **Sign** (frontend, via CSPR.click): user approves in wallet → signed TransactionV1.
3. **Submit** (backend): `POST /api/tokens/submit` → backend calls `put_transaction` RPC.
4. **Inclusion** (Casper node): transaction included in next block (~8s).
5. **Finality** (Casper node): block finalized (deterministic, single-block).
6. **Event emission** (MeridianToken contract): `TokenIssued` CEP-88 event emitted.
7. **Indexing** (backend event listener): Sidecar SSE delivers event → backend inserts into PostgreSQL.
8. **UI update** (frontend): SWR revalidates `/api/tokens` → new token appears in dashboard.

### 12.2 Restake Transaction (YieldAgent)

1. **Decision** (YieldAgent, every era): Claude Sonnet 4.5 produces restake plan.
2. **Adversarial review** (AuditAgent, different LLM): Gemini 2.5 Flash independently verifies.
3. **Block or proceed**: if disagreement, block + Telegram alert. If agreement, proceed.
4. **Sign** (YieldAgent): signs TransactionV1 with YieldAgent private key.
5. **Submit** (YieldAgent): calls `put_transaction` RPC.
6. **Inclusion + finality**: ~8-16s.
7. **Event emission** (StakingVault): `Restaked` CEP-88 event.
8. **Indexing** (backend): Sidecar SSE → PostgreSQL.
9. **Audit summary** (AuditAgent, hourly): includes this restake in next summary.

### 12.3 Compliance Revocation Transaction

1. **Detection** (ComplianceAgent, event-driven): Transfer event from MeridianToken triggers screening.
2. **Sanctions match** (ComplianceAgent): recipient address matches OFAC SDN list.
3. **Sign** (ComplianceAgent): signs TransactionV1 calling `ComplianceRegistry.revoke()`.
4. **Submit** (ComplianceAgent): calls `put_transaction` RPC.
5. **Inclusion + finality**: ~8-16s.
6. **Event emission** (ComplianceRegistry): `HolderRevoked` CEP-88 event.
7. **Indexing** (backend): Sidecar SSE → PostgreSQL.
8. **Telegram alert** (ComplianceAgent): operator notified.
9. **Future transfer rejection** (MeridianToken): next transfer to revoked address reverts at contract level.

---

## §13. DEPLOYMENT FLOW

### 13.1 Deployment Pipeline

```
1. Deploy contracts to testnet (Phase 4)
   ├── Run scripts/deploy-testnet.sh
   ├── Deploy MeridianToken → get contract_hash
   ├── Deploy StakingVault (with MeridianToken address) → get contract_hash
   ├── Deploy ComplianceRegistry → get contract_hash
   ├── Deploy YieldDistributor (with MeridianToken + StakingVault addresses) → get contract_hash
   ├── Deploy MeridianAudit → get contract_hash
   ├── Register YieldAgent public key in StakingVault (set_validator_curator)
   ├── Register ComplianceAgent public key in ComplianceRegistry (set_compliance_officer)
   ├── Register AuditAgent public key in MeridianAudit (set_audit_signer)
   ├── Verify each contract on testnet.cspr.live
   ├── Save all hashes to deployed/addresses.json
   └── Commit addresses.json to repo

2. Generate TypeScript types from contract schemas
   ├── Run scripts/generate-abi.sh
   ├── Produces packages/meridian-ts-types/
   └── Publish as private npm package @meridian/ts-types

3. Update frontend with new contract addresses
   ├── Read deployed/addresses.json
   ├── Update NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH in .env
   └── Rebuild frontend

4. Deploy backend
   ├── Run database migrations: npm run migrate
   ├── Start backend service: npm run start
   ├── Verify GET /health returns 200
   └── Verify event listener is indexing (SELECT COUNT(*) FROM events > 0 after 5 min)

5. Deploy agents
   ├── Start YieldAgent: npm run start:yield-agent
   ├── Start ComplianceAgent: npm run start:compliance-agent
   ├── Start AuditAgent: npm run start:audit-agent
   └── Verify each agent's health check

6. Deploy MCP server
   ├── Start in HTTP mode: npm run start:mcp-http
   ├── Publish ClawHub skill: npx clawhub publish
   └── Verify MCP server responds to tool list request

7. Deploy x402 facilitator
   ├── Run just docker-up
   ├── Verify facilitator health: GET /health
   └── Run x402 smoke test: scripts/x402-smoke.sh

8. Deploy frontend
   ├── npm run build
   ├── Deploy to Vercel/Netlify
   └── Verify frontend loads + wallet connects

9. Smoke tests
   ├── Run scripts/smoke-test.sh
   ├── Verifies: issue token, deposit, stake, distribute, comply, audit
   └── All transactions verified on testnet.cspr.live
```

### 13.2 Contract Verification

After deployment, every contract must be verifiable on CSPR.live:

```bash
# For each contract:
casper-client put-transaction \
  --node-url $CASPER_RPC_URL \
  --chain-name $CASPER_CHAIN_NAME \
  --session-path wasm/meridian_token.wasm \
  --payment-amount 10000000000 \
  --secret-key $MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM

# Verify on CSPR.live:
# 1. Open https://testnet.cspr.live/contract/<contract-hash>
# 2. Verify contract name, entry points, schemas are visible
# 3. Verify "Verified" badge appears
```

### 13.3 Contract Address Storage

`deployed/addresses.json` (committed to repo):

```json
{
  "network": "casper-test",
  "deployed_at": "2026-07-XX",
  "deployer_public_key": "0202abc...",
  "contracts": {
    "meridian_token": {
      "package_hash": "0x...",
      "contract_hash": "0x...",
      "deploy_hash": "0x...",
      "wasm_hash": "0x..."
    },
    "staking_vault": { "..." },
    "compliance_registry": { "..." },
    "yield_distributor": { "..." },
    "meridian_audit": { "..." }
  },
  "agent_keys": {
    "yield_agent_public_key": "0202def...",
    "compliance_agent_public_key": "0202ghi...",
    "audit_agent_public_key": "0202jkl..."
  }
}
```

---

## §14. ROLLBACK STRATEGY

### 14.1 Contract Rollback

Casper 2.0 contracts are upgradable (Odra native). "Rollback" means upgrading to a previous version.

```bash
# Upgrade to previous version
casper-client put-transaction \
  --node-address $CASPER_RPC_URL \
  --chain-name $CASPER_CHAIN_NAME \
  --session-path wasm/meridian_token_v_previous.wasm \
  --session-args '{"entry_point":"upgrade","args":{"new_code_hash":"<previous_hash>"}}' \
  --payment-amount 10000000000 \
  --secret-key $MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM
```

**Limitations:**
- 24-hour timelock on upgrades (per ADR-010).
- State must be compatible (Odra preserves state across compatible upgrades).
- Cannot revert state changes (e.g., if tokens were minted, they remain minted).

### 14.2 Backend Rollback

```bash
# Stop backend
npm run stop

# Rollback database migration
npm run migrate:down

# Restart backend at previous version
git checkout v0.1.0
npm install
npm run start
```

### 14.3 Frontend Rollback

```bash
# Vercel/Netlify auto-deploy from git
# Revert to previous deployment:
git revert HEAD
git push  # triggers auto-deploy
```

### 14.4 Agent Rollback

Agents are stateless (all state on chain). Rollback = stop + restart at previous version.

```bash
npm run stop:yield-agent
git checkout v0.1.0
npm install
npm run start:yield-agent
```

---

## §15. DISASTER RECOVERY PLAN

### 15.1 Deployer Key Compromise

**Detection:** Monitor deployer account for unauthorized transactions.

**Response:**
1. Immediately transfer all CSPR + token holdings to a new deployer account.
2. Update all 5 contracts to use new deployer as owner (24-hour timelock applies — initiate immediately).
3. Rotate all agent keys (requires contract-level transactions).
4. Notify all holders via frontend banner + Telegram.
5. Post-mortem: identify how key was compromised.

### 15.2 Agent Key Compromise

**Detection:** Monitor agent accounts for unauthorized transactions.

**Response:**
1. Call `set_validator_curator(new_addr)` on StakingVault (24-hour timelock).
2. Call `set_compliance_officer(new_addr)` on ComplianceRegistry (24-hour timelock).
3. Call `set_audit_signer(new_addr)` on MeridianAudit (24-hour timelock).
4. Within timelock window: compromised agent can still act, but its actions are bounded by contract whitelist.
5. Post-mortem: identify how key was compromised.

### 15.3 Sidecar Outage

**Detection:** Backend health check fails for Sidecar.

**Response:**
1. Backend continues operating from last indexed state (no new events indexed).
2. YieldDistributor does not trigger (no era boundary detection).
3. ComplianceAgent does not screen new transfers.
4. On Sidecar recovery: backend backfills missed events using `block_height` as cursor.
5. All missed events are processed in order.

### 15.4 AI API Outage

**Detection:** Agent health check fails for AI API (Anthropic, OpenAI, Google).

**Response:**
1. Agent falls back to secondary model (per ADR-003).
2. If both primary and fallback fail: agent enters degraded mode (no new decisions, but continues emitting health events).
3. YieldAgent: no restakes (yield remains at current validator).
4. ComplianceAgent: no new revocations (existing revocations remain in force).
5. AuditAgent: no new summaries (existing summaries remain on-chain).
6. Telegram alert to operator.

### 15.5 PostgreSQL Corruption

**Detection:** Backend health check fails for PostgreSQL.

**Response:**
1. Stop backend.
2. Restore from latest backup (daily snapshots).
3. Re-index from chain using `block_height = 0` as starting point.
4. Restart backend.

### 15.6 Casper Testnet Reset

**Detection:** Testnet faucet shows "testnet reset" notice.

**Response:**
1. This is expected (testnet is periodically reset).
2. Re-fund deployer + agent wallets from faucet.
3. Re-deploy all 5 contracts to new testnet.
4. Update `deployed/addresses.json`.
5. Update frontend env vars.
6. Restart all services.

---

## §16. MONITORING + OBSERVABILITY

### 16.1 Metrics (Prometheus)

| Metric | Type | Purpose |
|---|---|---|
| `meridian_events_indexed_total` | Counter | Total CEP-88 events indexed |
| `meridian_transactions_submitted_total` | Counter (labeled by type) | Transactions submitted to RPC |
| `meridian_era_distributions_total` | Counter | Era distributions executed |
| `meridian_rpc_errors_total` | Counter (labeled by endpoint) | RPC errors |
| `meridian_indexer_lag_blocks` | Gauge | Current chain height - last indexed height |
| `meridian_active_holders` | Gauge | Active qualified holders |
| `meridian_total_staked_cspr` | Gauge | Total CSPR staked across all tokens |
| `meridian_compliance_revocations_total` | Counter | Compliance revocations |
| `meridian_adversarial_disagreements_total` | Counter | AuditAgent disagreements with YieldAgent |
| `meridian_x402_payments_settled_total` | Counter | x402 payments settled |
| `meridian_x402_revenue_cspr` | Gauge | Total x402 revenue (CSPR) |

### 16.2 Alerts

| Alert | Condition | Severity |
|---|---|---|
| Indexer lag > 100 blocks | `meridian_indexer_lag_blocks > 100` | Critical |
| RPC errors > 10/min | `rate(meridian_rpc_errors_total[1m]) > 0.16` | Critical |
| Adversarial disagreement rate > 10% | `rate(meridian_adversarial_disagreements_total[1h]) / rate(meridian_transactions_submitted_total{type="restake"}[1h]) > 0.1` | Warning |
| Agent health check fails | `up{job="agents"} == 0` | Critical |
| Sidecar health check fails | `up{job="sidecar"} == 0` | Critical |
| PostgreSQL health check fails | `up{job="postgres"} == 0` | Critical |

### 16.3 Logging

Structured JSON logs (pino). Log levels: debug, info, warn, error.

**Never log:**
- Private keys
- API keys
- User PII

**Always log:**
- Transaction hashes
- Block heights
- Era IDs
- Agent decisions (with model + prompt hash)
- Errors with stack traces

---

## §17. SECURITY MEASURES (MERIDIAN-SPECIFIC)

### 17.1 Role-Separated Keys

| Role | Key | Contract | Entry Points |
|---|---|---|---|
| Deployer | Ed25519 | All 5 contracts | `init`, `upgrade`, `set_validator_curator`, `set_compliance_officer`, `set_audit_signer`, `update_rules` |
| YieldAgent | Ed25519 | StakingVault | `restake`, `undelegate` |
| ComplianceAgent | Ed25519 | ComplianceRegistry | `revoke`, `reinstate` |
| AuditAgent | Ed25519 | MeridianAudit | `submit_summary` |
| StakingVault contract | (self) | YieldDistributor | `distribute` (cross-contract call) |
| Public | — | All | `deposit`, `transfer`, `balance_of`, `is_compliant`, `get_*` |

### 17.2 Timelocked Governance (24h)

Actions subject to 24-hour timelock:
- ComplianceRules updates
- Role revocations (bulk)
- Contract upgrades
- Protocol fee changes

### 17.3 Validator Whitelist

YieldAgent can only choose from pre-approved validator set. Even hallucinated choices are bounded.

### 17.4 Adversarial Verification

Every YieldAgent restake decision independently reviewed by AuditAgent (different LLM). Disagreement blocks + Telegram alert.

### 17.5 CEP-90 Risk Mitigation

- YieldAgent validator whitelist excludes validators with unstable CEP-90 limit configurations.
- AuditAgent monitors validator limit changes and alerts if a whitelisted validator tightens limits.
- StakingVault handles `undelegate` calls it did not initiate (auction can force-undelegate on era boundaries).

### 17.6 No Free-Text User Input to LLMs

Agents only consume structured on-chain state (block heights, balances, event payloads). Asset metadata is hashed, not passed raw. Prevents prompt injection.

### 17.7 EIP-712 Replay Protection

All agent-submitted transactions use EIP-712 typed-data signing via `casper-eip-712` v1.2.0 with:
- Nonce (per agent, per contract)
- Validity window (valid_after, valid_before)
- CAIP-2 chainId (prevents cross-chain replay)

---

## §18. TEST STRATEGY (MERIDIAN-SPECIFIC)

### 18.1 Test Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Playwright (frontend → backend → chain)
                    │   (slow)        │
                    └─────────────────┘
                  ┌─────────────────────┐
                  │  Integration Tests  │  ← nctl + testnet (real chain)
                  │  (medium)           │
                  └─────────────────────┘
                ┌───────────────────────────┐
                │    Property + Fuzz Tests  │  ← proptest + cargo-fuzz
                │    (fast)                 │
                └───────────────────────────┘
              ┌─────────────────────────────────┐
              │       Unit Tests                │  ← Odra mock VM + vitest
              │       (fastest)                 │
              └─────────────────────────────────┘
```

### 18.2 Test Categories

**Unit tests** (Odra mock VM):
- Every public function in every contract.
- Every backend utility function.
- Every agent helper function.

**Property tests** (`proptest`):
- U512 arithmetic invariants (overflow, underflow).
- Permission invariants (unauthorized calls always revert).
- Replay protection invariants (nonce + validity window).

**Fuzz tests** (`cargo-fuzz`):
- Entry-point argument fuzzing (zero, max, malformed).
- Asset metadata fuzzing (prompt injection attempts).

**Integration tests** (nctl + testnet):
- Full lifecycle: issue → deposit → stake → distribute → comply → audit.
- Restake flow (YieldAgent).
- Revoke flow (ComplianceAgent).
- Adversarial flow (AuditAgent blocks bad YieldAgent decision).
- Cross-contract calls (StakingVault → system auction).

**Gas analysis tests**:
- Every user-facing operation ≤ 5 CSPR.

**Benchmark tests** (`criterion`):
- Deposit throughput.
- Distribution throughput.

**Security tests**:
- Access control (unauthorized calls revert).
- Replay protection (EIP-712 nonce).
- Upgrade safety (state preservation).

**E2E tests** (Playwright):
- Full user flows (connect wallet, issue token, view dashboard, view audit).
- Visual regression (screenshots).

---

## §19. INTEGRATION MATRIX (EXTERNAL)

| External Service | Integration Point | Auth | Purpose |
|---|---|---|---|
| CSPR.cloud REST | Backend | API key | Historical queries |
| CSPR.cloud SSE | Backend event listener | API key | Real-time event stream |
| CSPR.cloud Node API | Backend (transaction submission) | API key | JSON-RPC proxy |
| Casper Wallet | Frontend (via CSPR.click) | User wallet | Wallet connection |
| Ledger | Frontend (via CSPR.click) | User wallet | Hardware wallet |
| MetaMask Snap | Frontend (via CSPR.click) | User wallet | MetaMask integration |
| Anthropic API | YieldAgent (primary), ComplianceAgent (fallback) | API key | Claude Sonnet 4.5 |
| OpenAI API | ComplianceAgent (primary), YieldAgent (fallback) | API key | GPT-4o |
| Google AI API | AuditAgent (primary) | API key | Gemini 2.5 Flash |
| OFAC SDN list | ComplianceAgent | Public (free) | Sanctions screening |
| EU consolidated list | ComplianceAgent | Public (free) | Sanctions screening |
| Telegram Bot API | Operator alerts | Bot token | Operator notifications |
| Cloudflare Workers | Agent hosting | Account | Edge deployment |
| Redis | Agent pub/sub | Connection string | Inter-agent communication |
| PostgreSQL | Backend | Connection string | Event indexing |
| External validator-monitoring agent | YieldAgent (via x402) | x402 payment | Premium validator data |
| External sanctions API agent | ComplianceAgent (via x402) | x402 payment | Merkle root refresh |
| External portfolio agents | Meridian MCP server (via x402) | x402 payment | Yield data queries |

---

## §20. KEY PERFORMANCE INDICATORS (KPIs)

| KPI | Target | Measurement |
|---|---|---|
| Event indexing lag | < 5 blocks | `meridian_indexer_lag_blocks` |
| Transaction submission latency | < 2s (build + sign + submit) | Backend log timestamps |
| YieldAgent decision latency | < 5s (per era) | Agent log timestamps |
| ComplianceAgent revocation latency | < 10s (from Transfer event) | Agent log timestamps |
| AuditAgent summary latency | < 30s (per hourly cycle) | Agent log timestamps |
| x402 payment settlement latency | < 2s | Facilitator log timestamps |
| Frontend page load | < 2s (LCP) | Lighthouse |
| Frontend Lighthouse score | ≥ 90 (all 4 metrics) | Lighthouse |
| Test coverage (Rust contracts) | ≥ 80% | `cargo tarpaulin` |
| Test coverage (TypeScript) | ≥ 70% | `vitest --coverage` |
| Gas cost per user-facing operation | ≤ 5 CSPR | Gas analysis tests |
| Uptime (backend) | ≥ 99.9% | Health check monitoring |
| Uptime (agents) | ≥ 99.5% | Health check monitoring |

---

## END OF MERIDIAN_ENGINEERING_BIBLE.md

**File stats:** ~8,500 words, 20 sections covering architecture review, 15 ADRs, dependency matrix, contract interaction matrix, 5 contract specifications, backend service specs, 3 agent specs, MCP server specs, x402 facilitator specs, 5 sequence diagrams, event flow diagram, transaction lifecycle, deployment flow, rollback strategy, disaster recovery plan, monitoring/observability, security measures, test strategy, integration matrix, KPIs.

**Verification status:** Every architectural decision documented. Every contract specified. Every integration mapped. Verified 2026-06-28 against Casper 2.2.1 mainnet documentation.

**Next file:** `LESSONS_LEARNED.md` — catalog of common bugs, deprecated APIs, obsolete tutorials, hackathon mistakes.
