# FINAL_PROMPT.md — MERIDIAN EXECUTION OPERATING SYSTEM

> **STATUS:** SINGLE SOURCE OF TRUTH
> **PROJECT:** MERIDIAN — The Autonomous Compliant Yield Layer for Real-World Assets on Casper
> **EXECUTION TARGET:** Cursor IDE
> **MODE:** Production-ready, zero-mock, zero-placeholder, zero-skip
> **LAST VERIFIED:** 2026-06-28 against official Casper / Odra / x402 / MCP documentation
> **AUTHOR:** Principal Research Scientist · Casper Core Developer · AI Systems Architect

---

## 0.0 ABSOLUTE EXECUTION RULES

These rules override every other instruction in this file, every Cursor default, every tutorial, every Stack Overflow answer, every LLM suggestion. Violation of any single rule halts execution.

### RULE 1 — NO MOCK DATA. EVER.
- No mock RPC responses.
- No mock wallet balances.
- No mock staking yields.
- No mock compliance attestations.
- No mock AI responses.
- No mock MCP tool outputs.
- Every number, every hash, every signature, every timestamp must come from a real Casper node, a real PostgreSQL database, a real AI API, or a real MCP server. If a value cannot be obtained from a real source, the feature is BLOCKED until the source is wired.

### RULE 2 — NO PLACEHOLDERS.
- No `// TODO` comments in committed code.
- No `unimplemented!()` macros.
- No `panic!("not yet")`.
- No stub functions that return hardcoded values.
- No `return Ok(())` bodies that should call contracts.
- Every function body must do real work or be explicitly removed.

### RULE 3 — NO SIMULATED BLOCKCHAIN.
- Every contract call hits a real Casper node (testnet or mainnet).
- Every transaction is signed by a real Ed25519 keypair.
- Every transaction is broadcast via real RPC (`https://node.cspr.cloud/rpc` or local node).
- Every event is consumed via real Sidecar SSE (`/events/stream`).
- Every state query uses `casper-client query-global-state` against a real node.
- Never simulate `delegate`, `transfer`, `revoke`, or any other contract call in memory.

### RULE 4 — NO UNCERTAIN ASSUMPTIONS.
- If you are about to write code that depends on an API surface you have not verified in the last 7 days, STOP.
- Re-fetch the official documentation.
- If the documentation is ambiguous, open an issue in the relevant repo or ask in Casper Discord.
- Only resume when the assumption is verified.

### RULE 5 — VERIFY OFFICIAL DOCS FIRST.
- Before writing ANY code, you must re-read the relevant section of `https://docs.casper.network`.
- For Odra: `https://odra.dev/docs`.
- For x402: `https://github.com/odradev/casper-x402-poc` README.
- For MCP: `https://modelcontextprotocol.io` + the Casper MCP server READMEs.
- For CEP standards: `https://github.com/casper-network/ceps`.
- Tutorials older than 6 months are NOT authoritative. Code in `casper-network/*` repos on the `main`/`dev` branch IS authoritative.

### RULE 6 — ONE PHASE AT A TIME.
- Cursor must NEVER execute more than ONE phase from Part 5.
- At the end of every phase, Cursor must produce `PHASE_REPORT.md` and STOP.
- Human approval is required before starting the next phase.
- Auto-continuation is FORBIDDEN.

### RULE 7 — QUALITY GATE IS NON-NEGOTIABLE.
- 100% build success.
- 100% tests pass.
- 100% integration tests pass against real testnet.
- 0 warnings from `cargo clippy -- -D warnings`.
- 0 errors from `cargo fmt --check`.
- 0 deprecated APIs in dependency tree.
- 0 outdated SDKs in `Cargo.lock` or `package-lock.json`.
- Failure on any single check BLOCKS phase completion.

### RULE 8 — PIN EVERYTHING.
- Every Cargo dependency has an exact version pin (`=X.Y.Z`).
- Every npm dependency has an exact version pin in `package.json`.
- Every Rust toolchain has a `rust-toolchain.toml` pinning the channel and target.
- Every environment variable has a documented source and verification checklist.
- Reproducibility is mandatory.

### RULE 9 — OFFICIAL SOURCES ONLY.
- Use `casper-ecosystem/casper-client-rs` v5.0.1 (NOT `casper-network/casper-rust-sdk` which is WIP).
- Use `casper-js-sdk` v5.0.12 (NOT `@toruslabs/casper-js-sdk` which is abandoned).
- Use `@make-software/csprclick-sdk` v1.9.0 (NOT direct Casper Wallet integration).
- Use `casper-eip-712` v1.2.0 with `casper-native` feature (NOT custom EIP-712 implementations).
- Use CEP-18 v1.2.0 and CEP-78 v1.5.1+ (NOT earlier versions on Casper 2.0).
- Use `cargo-odra` v0.1.7 with `--locked` (NOT latest floating).
- Use `casper-client` v5.0.1 with `--locked` (NOT latest floating).
- Use Rust 1.85+ stable with `wasm32-unknown-unknown` target (NOT nightly, NOT wasm32-wasi).

### RULE 10 — DOCUMENTATION IS DELIVERABLE.
- Every public function has rustdoc (Rust) or TSDoc (TypeScript).
- Every contract entry point has a comment explaining its access control.
- Every environment variable is documented in `ENVIRONMENT_REQUIREMENTS.md`.
- Every user-facing action is documented in `USER_ACTIONS.md`.
- Every phase produces a `PHASE_REPORT.md`.
- Final state includes a `RUNBOOK.md` for operators.

---

## 0.1 THE EXECUTION LOOP

```
┌─────────────────────────────────────────────────────────┐
│  READ FINAL_PROMPT.md (this file)                       │
│                       │                                 │
│                       ▼                                 │
│  READ ENVIRONMENT_REQUIREMENTS.md                       │
│                       │                                 │
│                       ▼                                 │
│  READ USER_ACTIONS.md → confirm all complete            │
│                       │                                 │
│                       ▼                                 │
│  VERIFY all ENV vars are set and reachable              │
│                       │                                 │
│                       ▼                                 │
│  RE-FETCH official docs for the current phase           │
│                       │                                 │
│                       ▼                                 │
│  IMPLEMENT exactly ONE phase from Part 5                │
│                       │                                 │
│                       ▼                                 │
│  RUN cargo fmt / clippy / test / integration / e2e      │
│                       │                                 │
│                       ▼                                 │
│  RUN security tests + gas analysis + benchmark          │
│                       │                                 │
│                       ▼                                 │
│  RUN deployment dry-run                                 │
│                       │                                 │
│                       ▼                                 │
│  GENERATE PHASE_REPORT.md                               │
│                       │                                 │
│                       ▼                                 │
│  STOP. WAIT FOR HUMAN APPROVAL.                         │
└─────────────────────────────────────────────────────────┘
```

---

# PART 1 — COMPLETE RESEARCH INDEX

Every resource Cursor must consult. Every entry has been verified live as of 2026-06-28. Outdated entries are explicitly marked with `❌ DO NOT USE`.

## 1.1 Casper Protocol Core Documentation

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 1 | Casper Developer Docs (root) | Master documentation index | https://docs.casper.network | Authoritative source for every Casper capability | Phase 0 + every phase | 2.0.0+ | Continuous |
| 2 | Casper 2.0 Release Notes | Headline features list (Contract Access to Auction, CEP-88 events, Zug consensus, Multi-VM) | https://docs.casper.network/condor/index | Confirms Contract Access to Auction is real and mainnet-live | Phase 0 (verify) + Phase 2 (StakingVault) | v2.0.0 | 2025-05-06 |
| 3 | Casper Manifest | Strategic vision ("trust layer for the agent economy"; fixed gas costs; institutional RWA) | https://www.casper.network/news/manifest | Anchors MERIDIAN's thesis; cites $0.1 CSPR transfers and $2.5 CSPR delegation costs | Phase 0 + Phase 5 (gas analysis) | May 2026 | 2026-05 |
| 4 | Casper 2.0 Mainnet Launch Press Release | Confirms Contract Access to Auction is live on mainnet | https://www.casper.network/news/casper-2-0-live-on-mainnet | Verifies our central architectural assumption | Phase 0 | 2025-05-06 | 2025-05-06 |
| 5 | Casper AI Toolkit Landing | Lists all AI Toolkit components (x402, MCP servers, CSPR.click, Odra, CSPR.cloud) | https://www.casper.network/ai | AI architecture decisions | Phase 0 + Phase 6 (AI) | June 2026 | 2026-06-04 |
| 6 | Bonding Docs | How validators bond via the system auction | https://docs.casper.network/operators/becoming-a-validator/bonding | StakingVault contract design | Phase 2 | 2.0.0 | Continuous |
| 7 | Delegating Tokens Docs | How delegators call `delegate` entry point | https://docs.casper.network/users/delegating | StakingVault delegate entry point | Phase 2 | 2.0.0 | Continuous |
| 8 | Calling Contracts Docs | Cross-contract call patterns | https://docs.casper.network/developers/cli/calling-contracts | StakingVault calling system auction | Phase 2 | 2.0.0 | Continuous |
| 9 | Casper Account Model | Accounts, action thresholds, named keys, main purse | https://docs.casper.network/concepts/accounts-and-keys | ComplianceRegistry design | Phase 2 | 2.0.0 | Continuous |
| 10 | Native Access Controls | Casper 2.0 native access restrictions on stored contracts | https://docs.casper.network/next/developers/writing-onchain-code/native-access-controls | Restrict deposit/withdraw entry points | Phase 2 | 2.0.0 | Continuous |
| 11 | Casper Events Standard (CEP-88) | Native contract-level events with Merkle proofs | https://docs.casper.network/next/developers/writing-onchain-code/events | Audit trail for every agent decision | Phase 2 + Phase 6 | 2.0.0 | Continuous |
| 12 | RPC API Reference | JSON-RPC methods for transaction submission and state queries | https://docs.casper.network/developers/json-rpc | Backend blockchain sync | Phase 5 | 2.0.0 | Continuous |
| 13 | Opcode Costs Table | Gas costs for every operation | https://docs.casper.network/developers/cli/opcode-costs | Gas analysis | Phase 3 + Phase 10 | 2.0.0 | Continuous |
| 14 | Testnet Faucet | CSPR testnet drip | https://testnet.cspr.live/tools/faucet | Funding testnet wallets | Phase 0 | Live | Live |
| 15 | Casper Sidecar Setup | SSE event streaming service | https://docs.casper.network/operators/setup/casper-sidecar | Event indexing backend | Phase 5 | 2.1.0 | 2026-03-19 |
| 16 | Monitor and Consume Events | Sidecar event consumption patterns | https://docs.casper.network/developers/dapps/monitor-and-consume-events | Backend event listener | Phase 5 | 2.1.0 | Continuous |
| 17 | Casper Roadmap | Future protocol changes | https://www.casper.network/roadmap | Forward-compat planning | Phase 0 + Phase 11 | Live | Continuous |
| 18 | Casper 2.x Release Notes | changelog for 2.1 and 2.2 (block time 8s, fee burn, sustain purse) | https://github.com/casper-network/casper-node/releases | Era timing in YieldDistributor | Phase 2 + Phase 5 | 2.2.1 | 2026-05-26 |
| 19 | Casper Migration Guides | 1.x → 2.0 migration | https://docs.casper.network/next/whats-new | Avoiding deprecated APIs | Phase 0 | 2.0.0 | Continuous |
| 20 | Casper Discord | Developer support | https://discord.gg/casperblockchain | Q&A when docs are ambiguous | All phases | Live | Live |
| 21 | Casper Forum | Long-form technical discussion | https://forum.casper.network | CEP debate + governance | Phase 0 | Live | Live |

## 1.2 CEP Standards (Casper Enhancement Proposals)

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 22 | CEP Repository (all CEPs) | Index of all standards | https://github.com/casper-network/ceps | Reference for all CEPs | Phase 0 + Phase 2 | Live | 2026-05-26 |
| 23 | CEP-18 Fungible Token | ERC-20 equivalent on Casper | https://github.com/casper-ecosystem/cep18 | Base for MeridianToken | Phase 2 | 1.2.0 | 2024-04-11 |
| 24 | CEP-78 Enhanced NFT | NFT standard | https://github.com/casper-ecosystem/cep-78-enhanced-nft | Holder reputation passports | Phase 2 (optional) | 1.5.1 | 2025-07-14 |
| 25 | CEP-88 Events | Native contract events (folded into Casper 2.0) | https://github.com/casper-network/ceps | Audit event standard | Phase 2 | 2.0 native | 2.0.0 |
| 26 | CEP-86 Factory Pattern | Smarter contract installation | https://github.com/casper-network/ceps | Multi-asset deployment | Phase 2 + Phase 4 | Informational | N/A |
| 27 | CEP-90 Configurable Delegation Limits | Per-validator min/max delegation | https://github.com/casper-network/ceps/blob/master/text/0090-configurable-delegation-limits.md | Validator whitelist design + risk mitigation | Phase 2 | Informational | N/A |
| 28 | CEP-92 Burn Function | Native CSPR burn | https://github.com/casper-network/ceps | Deflationary mechanism (future) | Phase 2 (optional) | Informational | N/A |
| 29 | CEP-95 Notes Standard | On-chain notes | https://github.com/casper-network/ceps | Compliance annotation (future) | Phase 2 (optional) | Informational | N/A |

## 1.3 Odra Framework

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 30 | Odra Framework Source | Smart contract framework core | https://github.com/odradev/odra | Contract compilation | Phase 2 + Phase 3 | 2.8.1 | Oct-Nov 2025 |
| 31 | Odra Documentation | Framework docs | https://odra.dev/docs | Module patterns, testing, deployment | Phase 2 + Phase 3 | 2.8.x | Continuous |
| 32 | Odra `llms.txt` | AI-discoverable docs | https://odra.dev/llms.txt | Cursor must read this for autonomous Odra code generation | Phase 0 + Phase 2 | 2.8.x | Continuous |
| 33 | `cargo-odra` CLI | Project scaffolding, build, test | https://crates.io/crates/cargo-odra | Project creation | Phase 1 + Phase 2 | 0.1.7 | 2025 |
| 34 | Odra Book (in-depth guide) | Detailed tutorials | https://odra.dev/docs | Implementation patterns | Phase 2 | 2.8.x | Continuous |
| 35 | Odra Plugin Marketplace | Claude Code plugin | https://github.com/odradev/odradev-plugins | Cursor plugin for Odra | Phase 0 (optional) | Live | Continuous |
| 36 | Odra Modules Library | OpenZeppelin-equivalent primitives | https://odra.dev/docs/modules | Ownable, access control, pausable | Phase 2 | 2.8.x | Continuous |

## 1.4 Casper SDKs

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 37 | Casper JS SDK (official) | TypeScript / browser SDK | https://github.com/casper-ecosystem/casper-js-sdk | Frontend + MCP server | Phase 7 + Phase 8 | 5.0.12 | 2026-04-29 |
| 38 | Casper JS SDK Docs | API reference | https://casper-ecosystem.github.io/casper-js-sdk | TransactionV1Builder usage | Phase 7 + Phase 8 | 5.0.12 | Continuous |
| 39 | Casper Client (Rust) | CLI + library for Casper RPC | https://github.com/casper-ecosystem/casper-client-rs | All on-chain interactions from Rust/CLI | Phase 2 + Phase 5 | 5.0.1 | 2026-03-16 |
| 40 | Casper Rust/Wasm SDK | Wasm-compatible Rust SDK | https://github.com/casper-ecosystem/casper-rust-wasm-sdk | Browser-embedded Rust SDK (optional) | Phase 8 (optional) | 2.1.1 | Continuous |
| 41 | ❌ Casper Rust SDK (WIP) | DO NOT USE | https://github.com/casper-network/casper-rust-sdk | Explicitly WIP, no releases | NEVER | — | — |
| 42 | Casper EIP-712 Toolkit | Off-chain typed-data signing | https://github.com/casper-ecosystem/casper-eip-712 | Gasless meta-tx + x402 auth signatures | Phase 2 + Phase 7 | 1.2.0 | 2025 |

## 1.5 Casper System Contracts (Reference Implementations)

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 43 | `delegate` client contract | Reference for calling system auction from a contract | https://github.com/casper-network/casper-node/blob/dev/smart_contracts/contracts/client/delegate/src/main.rs | StakingVault implementation pattern | Phase 2 | v2.2.1 | 2026-05-26 |
| 44 | System Contracts (Mint, Auction, Handle Payment) | Reference for all system contracts | https://github.com/casper-network/casper-node/tree/dev/smart_contracts/contracts | Understanding system contract surfaces | Phase 2 | v2.2.1 | 2026-05-26 |
| 45 | Liquid Staking Contracts | Existing liquid staking reference | https://github.com/casper-ecosystem/liquid-staking-contracts | Pre-existing LST patterns on Casper | Phase 2 (study) | Live | Continuous |

## 1.6 Casper AI Toolkit Components

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 46 | Casper MCP Server (Tairon) | MCP server exposing wallet/balance/staking tools | https://github.com/Tairon-ai/casper-network-mcp | Backend MCP consumption pattern | Phase 5 + Phase 7 | 0.1.0 | 2025-11-04 |
| 47 | CSPR.trade MCP Server | MCP server for DEX operations | https://github.com/make-software/cspr-trade-mcp | Reference architecture for our MCP server | Phase 7 | 0.6.0 | 2026-04-28 |
| 48 | CSPR.trade MCP Public Endpoint | Live MCP endpoint (no install needed) | https://mcp.cspr.trade/mcp | Test MCP integration without self-hosting | Phase 7 | 0.6.0 | Live |
| 49 | CSPR.trade MCP Docs | Tool catalog + integration guide | https://mcp.cspr.trade | Canonical MCP tool design reference | Phase 7 | 0.6.0 | Continuous |
| 50 | Casper x402 PoC | Reference x402 facilitator implementation | https://github.com/odradev/casper-x402-poc | Our x402 facilitator (forked) | Phase 7 | No tag (active) | 2025-2026 |
| 51 | CSPR.click SDK | Wallet connection UX layer | https://docs.cspr.click | Frontend wallet integration | Phase 8 | 1.9.0 | 2025-07-22 |
| 52 | CSPR.click React Component | React wrapper for CSPR.click | https://docs.cspr.click/cspr.click-sdk/react | Next.js dApp integration | Phase 8 | 1.9.0 | 2025-07-22 |
| 53 | CSPR.cloud APIs | REST + Streaming + Node API layers | https://docs.cspr.cloud | All backend reads (replaces running our own node) | Phase 5 + Phase 7 | SaaS | Continuous |
| 54 | CSPR.cloud API Key Portal | API key signup | https://cspr.cloud | Backend authentication | Phase 0 (USER_ACTION) | Live | Live |
| 55 | CSPR.cloud Node API | Direct RPC proxy | https://node.cspr.cloud/rpc | Transaction submission from backend | Phase 5 | Live | Live |

## 1.7 MCP (Model Context Protocol) Specification

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 56 | MCP Specification | Protocol reference | https://modelcontextprotocol.io | Building our MCP server | Phase 7 | 2024-11-05 | Nov 2024 |
| 57 | MCP TypeScript SDK | Server framework | https://github.com/modelcontextprotocol/typescript-sdk | MCP server implementation | Phase 7 | Live | Continuous |
| 58 | Anthropic MCP Introduction | Conceptual overview | https://www.anthropic.com/news/model-context-protocol | Architecture decisions | Phase 0 | Live | Nov 2024 |
| 59 | OpenClaw / ClawHub | Claude Code skill marketplace | https://github.com/make-software/cspr-trade-mcp (skill reference) | Distributing our MCP skill | Phase 7 + Phase 11 | Live | Continuous |

## 1.8 Casper Wallets

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 60 | Casper Wallet (MAKE) | Browser extension wallet | https://www.casperwallet.xyz | Holder wallet | Phase 8 (via CSPR.click) | Live | Continuous |
| 61 | Casper Wallet Source | Integration reference (only via CSPR.click) | https://github.com/make-software/casper-wallet | Direct integration (deprecated) | NEVER direct; always CSPR.click | Live | Continuous |
| 62 | Casper Signer | Legacy browser wallet (deprecated) | https://github.com/casper-ecosystem/signer | ❌ DO NOT USE — replaced by Casper Wallet | NEVER | — | — |

## 1.9 Casper Indexers and Tooling

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 63 | CSPR.live Block Explorer | Testnet + mainnet explorer | https://testnet.cspr.live + https://cspr.live | Verify transactions during dev | All phases | Live | Live |
| 64 | Casper Sidecar Source | SSE + REST event indexing | https://github.com/casper-network/casper-sidecar | Self-hosted event indexer (alternative to CSPR.cloud) | Phase 5 (optional) | 2.1.0 | 2026-03-19 |
| 65 | Casper NCTL | Local network control | https://github.com/casper-network/casper-nctl | Local integration testing | Phase 3 + Phase 9 | Live | Oct 2025 |
| 66 | Casper DB Utils | LMDB operations | https://github.com/casper-network/casper-db-utils | Node operator tooling (not required) | NEVER (use CSPR.cloud instead) | — | — |

## 1.10 Casper GitHub Organization Map

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 67 | casper-network org | Core protocol repos | https://github.com/casper-network | Source of truth for protocol | Phase 0 | 77 repos | Continuous |
| 68 | casper-ecosystem org | SDKs + standard contracts | https://github.com/casper-ecosystem | SDKs and CEPs | Phase 1 + Phase 2 | 79 repos | Continuous |
| 69 | odradev org | Odra framework + x402 + cspr.trade source | https://github.com/odradev | Smart contract framework | Phase 2 + Phase 7 | 10 repos | Continuous |
| 70 | make-software org | CSPR.click + Casper Wallet | https://github.com/make-software | Wallet UX | Phase 8 | Live | Continuous |

## 1.11 Halborn Audit

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 71 | Halborn Casper 2.0 Audit | Independent security audit | https://www.halborn.com/audits/casper-association/casper-20-12a8fb | Reference for threat model | Phase 0 + Phase 10 | 2.0 | 2025 |

## 1.12 ERC-3643 (RWA Token Standard)

| # | Resource | Purpose | Official URL | Why We Need It | When Used | Version | Last Release |
|---|---|---|---|---|---|---|---|
| 72 | ERC3643 Association | The RWA standard body | https://www.erc3643.org | Casper joined Oct 2025 | Phase 0 | Live | Oct 2025 |
| 73 | ERC3643 Spec | Token standard specification | https://github.com/ERC3643/ERC3643-Standard | ComplianceRegistry design | Phase 2 | Live | Continuous |
| 74 | Tokeny (T-REX) | Reference ERC-3643 implementation on Ethereum | https://tokeny.com/erc3643 | Pattern reference (we adapt to Casper) | Phase 2 (study) | Live | Continuous |

---

# PART 2 — PROJECT AUDIT (Architecture vs Latest Docs)

The original MERIDIAN architecture (from the strategy dossier) was correct in its core thesis but contained several outdated API references and assumptions that must be corrected before Cursor writes any code. This audit was performed against the verified latest documentation (Part 1 + research reports).

## 2.1 ✅ CONFIRMED CORRECT (No Changes)

| Item | Status | Evidence |
|---|---|---|
| Contract Access to Auction is real | ✅ Confirmed | Casper 2.0 release notes, mainnet press release (May 6, 2025), working Rust reference impl in casper-node repo |
| StakingVault can call `delegate` on system auction | ✅ Confirmed | `runtime::call_contract::<()>(system::get_auction(), auction::METHOD_DELEGATE, args)` pattern is documented and used in `smart_contracts/contracts/client/delegate/src/main.rs` |
| ERC-3643 + native yield is Casper-unique | ✅ Confirmed | No other L1 ships Contract Access to Auction in production |
| CEP-88 verifiable events for audit trail | ✅ Confirmed | Native Casper 2.0 feature |
| Odra is the correct contract framework | ✅ Confirmed | v2.8.1 is current, supports Casper 2.0 |
| Manifest names "compliant staking-yield RWA tokens" as a want-to-be-built | ✅ Confirmed | Verified in Manifest text |

## 2.2 ❌ AUDIT FINDINGS (Required Corrections)

### Finding A — Use `TransactionV1` everywhere, NOT `Deploy`

**Problem:** The original dossier used `Deploy` terminology in pseudocode. Casper 2.0 deprecated `Deploy` entirely.

**Fix:** Every code path must use `TransactionV1` / `Transaction`. The `casper-client` v5.0.1 CLI uses `make transaction` (not `make deploy`). The `casper-js-sdk` v5.0.12 uses `TransactionV1Builder` (not `DeployUtil.makeDeploy`).

**Impact:** All Rust pseudocode in StakingVault, all TypeScript in agents, all frontend code in dApp.

### Finding B — Use `runtime::call_subcall` for cross-contract calls (not legacy `call_contract`)

**Problem:** Original pseudocode used `runtime::call_contract` directly. Per the V-1 verification report, Casper 2.0 introduces `runtime::call_subcall` for scoped gas + permissions on cross-contract calls.

**Fix:** StakingVault must use `runtime::call_subcall` when calling the system auction's `delegate` entry point. Reference impl in `casper-node/smart_contracts/contracts/client/delegate/src/main.rs` uses `runtime::call_contract` because it is a session contract (top-level), but stored contracts wrapping the auction should use `call_subcall`.

**Verification required:** Confirm via `https://docs.casper.network/next/developers/writing-onchain-code/cross-contract-calls` whether `call_subcall` is the canonical Casper 2.0 pattern. If documentation is ambiguous, file an issue on `casper-network/casper-node` before implementing.

### Finding C — Do NOT hardcode system auction hash

**Problem:** Original dossier mentioned testnet and mainnet auction hashes as constants. Casper 2.0 may have updated hashes during protocol migration.

**Fix:** StakingVault must use `system::get_auction()` at runtime to fetch the current auction contract hash. NEVER hardcode. This is the documented best practice.

### Finding D — Use `casper-client` v5.0.1 (Rust), NOT `casper-rust-sdk`

**Problem:** Original dossier mentioned the new `casper-rust-sdk` for agents. V-1 verification confirms this crate is still WIP with zero releases.

**Fix:** Use `casper-ecosystem/casper-client-rs` v5.0.1 for all Rust ↔ Casper-node interaction. CLI: `cargo install casper-client --version 5.0.1 --locked`. Library: `casper-client = { version = "5.0.1", default-features = false }`.

### Finding E — Do NOT use `@toruslabs/casper-js-sdk`

**Problem:** npm contains a `@toruslabs/casper-js-sdk` package (abandoned v2.5.1, last published 5 years ago).

**Fix:** Use only the unscoped `casper-js-sdk@5.0.12` package. Verify in `package.json` that no `@toruslabs/*` dependency appears.

### Finding F — Use CEP-18 v1.2.0 and CEP-78 v1.5.1+

**Problem:** Earlier CEP versions are NOT Casper 2.0-compatible due to URef semantics changes and `condor` → `casper_2` chainspec key rename.

**Fix:** Pin CEP-18 reference at v1.2.0 (commit `5e3e9c7` or tag `v1.2.0`). Pin CEP-78 reference at v1.5.1 or later. Verify in `Cargo.toml` of contracts.

### Finding G — Use CSPR.click v1.9.0+ for wallet integration (NOT direct Casper Wallet)

**Problem:** Original dossier mentioned both CSPR.click and Casper Wallet. Direct Casper Wallet integration is deprecated.

**Fix:** Frontend must use `@make-software/csprclick-sdk` v1.9.0+ and `@make-software/csprclick-react` v1.9.0+. Never import `@make-software/casper-wallet` directly. Use `onStatusUpdate` callback in `send()` for live transaction status (WebSocket-backed, replaces polling).

### Finding H — Use `casper-eip-712` v1.2.0 with `casper-native` feature

**Problem:** Original dossier mentioned EIP-712 signing. Need to ensure `casper-native` feature is enabled for Casper Ed25519 verification + `TransferAuthorization` structs (EIP-3009 pattern, used by x402).

**Fix:** `Cargo.toml`: `casper-eip-712 = { version = "1.2.0", features = ["casper-native"] }`. Requires `casper-types = "7"` in dependency tree.

### Finding I — Casper 2.0 era is 8-second blocks (not 16-second)

**Problem:** Original dossier mentioned era duration of "32 minutes on Casper 2.1 with 8-second blocks." This is correct for v2.1+ but the timing math should be verified.

**Fix:** Era = 240 blocks × 8 seconds = 1920 seconds = 32 minutes. YieldDistributor must compute era boundaries from `chain_height` (not from a wall-clock timer). Backend must subscribe to `block_finalized` SSE events from Sidecar and trigger distribution at era boundaries.

### Finding J — `delegate` call costs 2.5 CSPR (fixed, deterministic)

**Problem:** Original dossier did not specify the exact delegation gas cost.

**Fix:** Gas analysis must assume 2.5 CSPR per `delegate`, `undelegate`, `redelegate` call. Native CSPR transfer = 0.1 CSPR. These are chainspec-enforced and confirmed in the Casper Manifest.

### Finding K — CEP-90 forced undelegation is a real risk

**Problem:** Original dossier mentioned CEP-90 but did not account for forced undelegation risk.

**Fix:** YieldAgent validator whitelist must exclude validators with unstable CEP-90 limit configurations. AuditAgent must monitor validator limit changes and alert if a whitelisted validator tightens limits. StakingVault must handle `undelegate` calls that it did not initiate (the auction can force-undelegate on era boundaries per CEP-90).

### Finding L — Use `odra` v2.8.1 + `cargo-odra` v0.1.7 with `--locked`

**Problem:** Original dossier mentioned "Odra 2.8" generically.

**Fix:** Pin `odra = "=2.8.1"` in `Cargo.toml`. Install `cargo-odra` with `cargo install cargo-odra --version 0.1.7 --locked`. Never install without `--locked` (causes reproducibility breaks).

### Finding M — Rust toolchain must be 1.85+ stable, target `wasm32-unknown-unknown`

**Problem:** Original dossier did not specify Rust toolchain version.

**Fix:** `rust-toolchain.toml` in repo root:
```toml
[toolchain]
channel = "stable"
components = ["rustfmt", "clippy"]
targets = ["wasm32-unknown-unknown"]
```
Never use Rust nightly. Never use `wasm32-wasi` target.

### Finding N — Use `just` (not `make`) for command runner

**Problem:** Original dossier did not specify command runner.

**Fix:** All Odra + x402 projects use `justfile` (not `Makefile`). Install `just` via `cargo install just --locked` (NOT `apt install just`). Verify with `just --version` (must be ≥ 1.40.0).

### Finding O — Casper Sidecar is REST-only (not RPC)

**Problem:** Original dossier mentioned Sidecar but did not specify API surface.

**Fix:** Backend must consume Sidecar via REST (`/events/stream` for SSE, `/events` for filtered queries, `/blocks/{height}/events` for historical). NEVER point `casper-client` at Sidecar — Sidecar is not an RPC proxy. Use `https://node.cspr.cloud/rpc` for RPC.

### Finding P — StakingVault must use contract's own main purse (deposit pattern)

**Problem:** Original dossier did not clarify whether StakingVault delegates from user purses or from its own purse.

**Fix:** StakingVault uses the deposit pattern: user transfers CSPR into StakingVault's main purse via a `deposit()` entry point. StakingVault then calls `system::get_auction().delegate(...)` on its own behalf, using its own main purse. The delegator public key passed to `delegate` is the StakingVault contract's own public key (its account hash). This is the standard liquid-staking pattern confirmed in `casper-ecosystem/liquid-staking-contracts`.

### Finding Q — Era boundary detection via Sidecar SSE (not polling)

**Problem:** Original dossier mentioned era-based distribution but did not specify the trigger mechanism.

**Fix:** Backend subscribes to Sidecar SSE (`/events/stream`). On `block_finalized` event, compute `era_id = block_height / 240` (assuming 240-block eras). When `era_id` increments, trigger YieldDistributor. NEVER poll. NEVER use wall-clock timers for era boundaries.

### Finding R — Use `PricingMode::Prepaid` for gasless flows (future)

**Problem:** Original dossier mentioned gasless flows as a future item.

**Fix:** This is a Manifest Tier-2 feature, NOT yet shipped on mainnet. Do NOT implement gasless flows in the hackathon build. Document as a roadmap item. The `casper-eip-712` Permit pattern can be used as a workaround if needed for the demo, but the real `PricingMode::Prepaid` requires protocol-level support.

## 2.3 Audit Verdict

**The MERIDIAN architecture is fundamentally sound.** All 18 audit findings are corrections to API references, not design changes. The central thesis — "the first protocol where any RWA token natively earns Casper staking yield through AI-managed ERC-3643-compliant contracts that call the system auction directly" — is verified, mainnet-live, and supported by working reference implementations in `casper-network/casper-node`.

Proceed to implementation with the corrections above applied.

---

# PART 3 — ENVIRONMENT REQUIREMENTS

> **PRE-REQUISITE FILE:** `ENVIRONMENT_REQUIREMENTS.md` (sibling to this file)
> Every variable must be verified BEFORE Phase 1 begins.

## 3.1 Environment Variable Master Index

The following 23 environment variables must be set before any code can run. They are organized by category. See `ENVIRONMENT_REQUIREMENTS.md` for full details on each.

### A. Casper Network
- `CASPER_NETWORK` — `casper-test` (testnet) or `casper` (mainnet)
- `CASPER_RPC_URL` — `https://node.cspr.cloud/rpc` (CSPR.cloud Node API)
- `CASPER_API_KEY` — from CSPR.cloud portal (https://cspr.cloud)
- `CASPER_CHAIN_NAME` — `casper-test` or `casper` (for TransactionV1 chain name)
- `CASPER_SIDE_CAR_URL` — `https://api.cspr.cloud` (REST + SSE)

### B. Deployer Keys (NEVER commit; stored in OS keychain or 1Password CLI)
- `MERIDIAN_DEPLOYER_PUBLIC_KEY` — Ed25519 hex public key of deployer account
- `MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM` — path to PEM file (NEVER the key content itself)
- `MERIDIAN_DEPLOYER_ACCOUNT_HASH` — derived from public key (verification only)

### C. Agent Keys (one per agent; each registered in its respective contract)
- `MERIDIAN_YIELD_AGENT_PUBLIC_KEY`
- `MERIDIAN_YIELD_AGENT_PRIVATE_KEY_PEM`
- `MERIDIAN_COMPLIANCE_AGENT_PUBLIC_KEY`
- `MERIDIAN_COMPLIANCE_AGENT_PRIVATE_KEY_PEM`
- `MERIDIAN_AUDIT_AGENT_PUBLIC_KEY`
- `MERIDIAN_AUDIT_AGENT_PRIVATE_KEY_PEM`

### D. AI Provider APIs
- `ANTHROPIC_API_KEY` — for Claude Sonnet 4.5 (YieldAgent primary, ComplianceAgent fallback)
- `OPENAI_API_KEY` — for GPT-4o (ComplianceAgent primary, YieldAgent fallback)
- `GOOGLE_API_KEY` — for Gemini 2.5 Flash (AuditAgent primary)

### E. Database
- `DATABASE_URL` — PostgreSQL connection string (e.g. `postgres://meridian:***@localhost:5432/meridian`)
- `REDIS_URL` — Redis connection string for agent pub/sub

### F. External Data APIs
- `OFAC_SDN_FEED_URL` — OFAC sanctions list XML feed
- `EU_CONSOLIDATED_LIST_URL` — EU consolidated sanctions list

### G. Frontend
- `NEXT_PUBLIC_CASPER_NETWORK` — exposed to browser (testnet or mainnet)
- `NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH` — published after Phase 4 deployment
- `NEXT_PUBLIC_MCP_SERVER_URL` — Meridian MCP server URL (production: `https://mcp.meridian.casper.network`)

### H. x402 Facilitator
- `X402_FACILITATOR_PORT` — default `3001`
- `X402_PAYMENT_TOKEN_CONTRACT_HASH` — CEP-18 token used for x402 payments (deployed in Phase 4)

## 3.2 Verification Checklist (run before Phase 1)

```bash
# Run this script. ALL checks must pass.
./scripts/verify-env.sh
```

The script verifies:
1. Every variable is set in the environment
2. `CASPER_API_KEY` returns 200 from `https://api.cspr.cloud/health`
3. `CASPER_RPC_URL` responds to `info_get_status` RPC
4. `MERIDIAN_DEPLOYER_PUBLIC_KEY` resolves to an account with ≥ 100 CSPR balance on testnet
5. Each agent keypair is valid (sign + verify round-trip)
6. `ANTHROPIC_API_KEY` returns 200 from `https://api.anthropic.com/v1/models`
7. `OPENAI_API_KEY` returns 200 from `https://api.openai.com/v1/models`
8. `GOOGLE_API_KEY` returns 200 from `https://generativelanguage.googleapis.com/v1/models`
9. PostgreSQL connection succeeds (`psql $DATABASE_URL -c 'SELECT 1'`)
10. Redis connection succeeds (`redis-cli -u $REDIS_URL ping`)

**If ANY check fails, FIX THE ROOT CAUSE before proceeding.** Never set a variable to a placeholder value.

---

# PART 4 — USER ACTION CHECKLIST

> **PRE-REQUISITE FILE:** `USER_ACTIONS.md` (sibling to this file)
> These are the ONLY things that require a human. Everything else is automated by Cursor.

## 4.1 Human-Required Actions (cannot be automated)

1. **Install Rust toolchain** — `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable && rustup target add wasm32-unknown-unknown`
2. **Install `just`** — `cargo install just --locked` (≥1.40.0)
3. **Install `cargo-odra`** — `cargo install cargo-odra --version 0.1.7 --locked`
4. **Install `casper-client`** — `cargo install casper-client --version 5.0.1 --locked`
5. **Install Node.js 20+** — https://nodejs.org (or `nvm install 20 && nvm use 20`)
6. **Install PostgreSQL 15+** — OS package manager or Docker
7. **Install Redis 7+** — OS package manager or Docker
8. **Install Docker Desktop** (for x402 facilitator) — https://docker.com
9. **Create Casper Wallet** — install browser extension from official store
10. **Create CSPR.cloud account** — https://cspr.cloud → Sign up → Profile → API Keys → Create new key
11. **Generate deployer keypair** — `casper-client keygen -a ed25519 ./keys/meridian-deployer` (produces public_key.pem, secret_key.pem)
12. **Generate 3 agent keypairs** — same `casper-client keygen` for `yield-agent`, `compliance-agent`, `audit-agent`
13. **Fund deployer wallet on testnet** — claim from https://testnet.cspr.live/tools/faucet (75 CSPR per 24h; fund deployer with ≥ 500 CSPR by claiming 7 days in a row or transfer from another funded account)
14. **Fund agent wallets on testnet** — transfer 50 CSPR each from deployer to each agent account
15. **Create Anthropic API account** — https://console.anthropic.com → API Keys
16. **Create OpenAI API account** — https://platform.openai.com → API Keys
17. **Create Google AI API account** — https://aistudio.google.com → API Keys
18. **Configure `.env` file** — copy `.env.example` to `.env`, fill in all values from the above steps
19. **Run verification script** — `./scripts/verify-env.sh` (must pass all 10 checks)
20. **Approve each phase** — review `PHASE_REPORT.md` after each phase and approve or request changes

## 4.2 Automated Actions (Cursor handles these)

- Repository scaffolding
- Cargo.toml + package.json generation with pinned versions
- All Rust contract code (MeridianToken, StakingVault, ComplianceRegistry, YieldDistributor, MeridianAudit)
- All TypeScript agent code
- MCP server implementation
- x402 facilitator fork + customization
- Frontend (Next.js 16 + Tailwind 4 + shadcn/ui)
- Database migrations
- Event listener service
- All tests (unit, integration, e2e, fuzz, property, security)
- Contract deployment scripts
- Contract verification on CSPR.live
- SDK generation
- Documentation generation
- CI/CD pipelines
- `PHASE_REPORT.md` generation

---

# PART 5 — IMPLEMENTATION PHASES

Each phase has: Objectives, Files, Dependencies, Acceptance Criteria, Tests, Rollback Plan, Risk Analysis.

Cursor executes EXACTLY ONE phase. Produces `PHASE_REPORT.md`. Waits for human approval.

## PHASE 0 — Research Validation

### Objectives
- Re-verify every URL in Part 1 returns 200 OK
- Re-verify Contract Access to Auction API surface against `casper-network/casper-node` source on `main` branch
- Re-verify Odra 2.8.1 + cargo-odra 0.1.7 install cleanly
- Re-verify all CEP versions (CEP-18 v1.2.0, CEP-78 v1.5.1)
- Re-verify CSPR.cloud API key works (REST + Node API + SSE)
- Re-verify all AI API keys work

### Files
- `research-validation-report.md` (output)
- `.env.example` (generated from verified requirements)

### Dependencies
- Human completed USER_ACTIONS.md items 1-19

### Acceptance Criteria
- Every URL in Part 1 returns 200 OK (or expected redirect)
- `cargo-odra --version` returns `0.1.7`
- `casper-client --version` returns `5.0.1`
- `just --version` returns ≥ `1.40.0`
- `rustc --version` returns ≥ `1.85.0`
- `casper-client get-account-info --node-url $CASPER_RPC_URL --public-key $MERIDIAN_DEPLOYER_PUBLIC_KEY` returns balance ≥ 100 CSPR
- All 3 AI provider APIs respond 200 to /models endpoint
- CSPR.cloud REST, SSE, and Node API all reachable with API key

### Tests
- `./scripts/verify-env.sh` passes all 10 checks
- Manual: clone `casper-network/casper-node`, checkout `v2.2.1`, locate `smart_contracts/contracts/client/delegate/src/main.rs`, confirm file exists and matches expected pattern

### Rollback Plan
- No code changes; rollback = delete `research-validation-report.md`

### Risk Analysis
- **Low risk:** documentation URLs may have moved → re-search and update Part 1
- **Medium risk:** AI provider API key rate limits may require paid tier → upgrade or use mock only in Phase 0 (NEVER in later phases)
- **High risk:** Contract Access to Auction API surface may have changed since v2.2.1 → if so, halt and update Part 2 audit before continuing

---

## PHASE 1 — Environment Setup

### Objectives
- Scaffold monorepo structure
- Generate all pinned dependency files
- Generate `rust-toolchain.toml`
- Generate `justfile` with all common targets
- Generate `.env.example` from Phase 0 verification
- Generate `scripts/verify-env.sh`
- Set up CI (GitHub Actions)

### Files
```
meridian/
├── .github/workflows/ci.yml
├── .gitignore
├── .env.example
├── LICENSE                                  (Apache-2.0)
├── README.md                                (1-paragraph overview + link to FINAL_PROMPT.md)
├── rust-toolchain.toml
├── justfile
├── Cargo.toml                               (workspace)
├── package.json                             (root, for npm workspaces)
├── docker-compose.yml                       (postgres + redis + nctl)
├── scripts/
│   ├── verify-env.sh
│   ├── bootstrap.sh                         (installs all deps)
│   ├── fund-testnet.sh
│   └── deploy-contracts.sh
├── contracts/
│   ├── Cargo.toml
│   └── (empty, filled in Phase 2)
├── agents/
│   └── package.json
├── mcp-server/
│   └── package.json
├── x402-facilitator/
│   └── (forked from odradev/casper-x402-poc)
├── frontend/
│   └── package.json
├── backend/
│   └── package.json
├── docs/
│   ├── FINAL_PROMPT.md                      (this file, copied)
│   ├── ENVIRONMENT_REQUIREMENTS.md
│   ├── USER_ACTIONS.md
│   └── architecture.md
└── tests/
    └── (integration + e2e tests)
```

### Dependencies
- Phase 0 complete (all ENV vars verified)

### Acceptance Criteria
- `just bootstrap` runs end-to-end without errors on a clean machine
- `cargo build --workspace` succeeds
- `npm install` at root succeeds
- `docker-compose up -d postgres redis` succeeds and both services respond to health checks
- `./scripts/verify-env.sh` passes all 10 checks
- GitHub Actions CI runs on push and passes (lint + fmt + clippy)

### Tests
- `just bootstrap` exit code 0
- `cargo --version` matches expected
- `node --version` ≥ 20
- `psql $DATABASE_URL -c 'SELECT 1'` returns 1
- `redis-cli -u $REDIS_URL ping` returns PONG

### Rollback Plan
- Delete all generated files. Restore from git if committed.

### Risk Analysis
- **Medium risk:** Platform-specific binary installs may fail on macOS vs Linux → bootstrap.sh must detect OS and branch
- **Medium risk:** Pinning exact Cargo versions may cause dependency conflicts → resolve via `cargo update -p <conflicted-crate> --precise <version>`
- **Low risk:** Docker Desktop not installed → USER_ACTION

---

## PHASE 2 — Smart Contracts

### Objectives
- Implement 5 Odra contracts (MeridianToken, StakingVault, ComplianceRegistry, YieldDistributor, MeridianAudit)
- Each contract: real implementation, no stubs, no TODOs
- Each contract compiles to WASM
- Each contract has unit tests + property tests + fuzz tests
- Each contract has documented access control
- Each contract emits CEP-88 events on every state change

### Files
```
contracts/
├── Cargo.toml                                (workspace)
├── meridian-token/
│   ├── Cargo.toml
│   ├── src/lib.rs
│   ├── src/error.rs
│   ├── src/event.rs
│   └── tests/
│       ├── unit.rs
│       ├── property_tests.rs
│       └── fuzz_targets.rs
├── staking-vault/
│   ├── Cargo.toml
│   ├── src/lib.rs                            (uses runtime::call_subcall on system auction)
│   ├── src/error.rs
│   ├── src/event.rs
│   └── tests/
│       ├── unit.rs
│       ├── property_tests.rs
│       ├── fuzz_targets.rs
│       └── integration.rs                    (against local nctl network)
├── compliance-registry/
│   ├── Cargo.toml
│   ├── src/lib.rs
│   ├── src/error.rs
│   ├── src/event.rs
│   ├── src/rules.rs                          (pluggable ComplianceRules engine)
│   └── tests/
│       ├── unit.rs
│       ├── property_tests.rs
│       ├── fuzz_targets.rs
│       └── edge_cases.rs
├── yield-distributor/
│   ├── Cargo.toml
│   ├── src/lib.rs
│   ├── src/error.rs
│   ├── src/event.rs
│   └── tests/
│       ├── unit.rs
│       ├── property_tests.rs
│       ├── fuzz_targets.rs
│       └── overflow_tests.rs
└── meridian-audit/
    ├── Cargo.toml
    ├── src/lib.rs
    ├── src/error.rs
    ├── src/event.rs
    └── tests/
        └── unit.rs
```

### Dependencies
- Phase 1 complete (env setup + Cargo workspace)

### Acceptance Criteria
- `cargo odra build` succeeds for all 5 contracts (produces WASM in `wasm/` dir)
- `cargo test --workspace` passes (100% pass rate)
- `cargo clippy --workspace -- -D warnings` returns 0 warnings
- `cargo fmt --check` returns 0 diffs
- Each contract has fuzz tests (run via `cargo +nightly fuzz run <target>` — NOTE: nightly ONLY for fuzz runner, NOT for contract compilation)
- Property tests via `proptest` crate pass for: overflow, permission boundaries, replay attacks, upgrade scenarios
- StakingVault integration test against local nctl network: actually delegates CSPR via `runtime::call_subcall` and verifies era rewards accrue
- ComplianceRegistry edge cases: bulk revoke + reinstate, expired attestation, sanctions match
- YieldDistributor overflow tests: max U512 values, zero-holders case, non-compliant-only case
- Every entry point has rustdoc explaining access control
- Every state change emits a CEP-88 event

### Tests Required
1. **Unit tests** — every public function
2. **Property tests** — `proptest` for invariants (overflow, permissions, replay)
3. **Fuzz tests** — `cargo-fuzz` for entry-point argument fuzzing
4. **Edge cases** — zero values, max values, empty arrays, duplicate entries
5. **Overflow tests** — U512 arithmetic boundaries
6. **Permission tests** — every access-controlled entry point reverts when called by unauthorized account
7. **Upgrade tests** — Odra `upgrade()` works and preserves state
8. **Event tests** — every state change emits correct CEP-88 event with correct fields
9. **Deployment tests** — contract installs successfully on nctl
10. **Integration tests** — StakingVault → system auction, MeridianToken → ComplianceRegistry → StakingVault, YieldDistributor → StakingVault → MeridianToken

### Rollback Plan
- `git reset --hard HEAD~1` to before Phase 2 commit
- Delete `contracts/` directory
- Re-run Phase 2 from scratch

### Risk Analysis
- **HIGH RISK:** Contract Access to Auction may require `call_subcall` (Finding B) — verify against `casper-node` source. If `call_subcall` is wrong, use `call_contract` (matching the reference impl). Document the choice in code comment.
- **HIGH RISK:** CEP-90 forced undelegation handling — StakingVault must handle the case where the auction force-undelegates mid-era. Test: simulate CEP-90 limit change, verify StakingVault state remains consistent.
- **MEDIUM RISK:** U512 overflow in YieldDistributor (rewards × holders × eras) — use checked arithmetic everywhere; revert on overflow.
- **MEDIUM RISK:** Era boundary detection in tests — use nctl's deterministic era progression; do NOT rely on wall-clock.
- **LOW RISK:** Odra 2.8.1 API surface changes from 2.8.0 — pin `=2.8.1` and check changelog.

---

## PHASE 3 — Contract Testing & Local Deployment

### Objectives
- Deploy all 5 contracts to local nctl network
- Run integration test suite against deployed contracts
- Gas analysis report (cost of every operation)
- Benchmark report (throughput: deposits/sec, distributions/sec)
- Security review checklist complete

### Files
```
tests/
├── integration/
│   ├── deploy.rs                             (deploy all 5 contracts to nctl)
│   ├── full_lifecycle.rs                     (issue → stake → distribute → comply → audit)
│   ├── restake.rs                            (YieldAgent restake flow)
│   ├── revoke.rs                             (ComplianceAgent revoke flow)
│   └── adversarial.rs                        (attacker attempts to drain StakingVault)
├── gas-analysis/
│   └── gas_report.rs                         (measure CSPR cost of every operation)
├── benchmarks/
│   ├── deposit_bench.rs
│   └── distribute_bench.rs
└── security/
    ├── access_control.rs                     (unauthorized calls revert)
    ├── replay_protection.rs                  (EIP-712 nonce + validity window)
    └── upgrade_safety.rs                     (state preservation across upgrades)
```

### Dependencies
- Phase 2 complete (all 5 contracts compile + pass unit tests)
- Local nctl network running (Docker)

### Acceptance Criteria
- All 5 contracts deploy to nctl without errors
- `tests/integration/full_lifecycle.rs` passes: issue token → deposit CSPR → StakingVault delegates → era advances → rewards accrue → YieldDistributor distributes → CEP-88 events emitted
- Gas analysis report generated: every entry point's CSPR cost documented
- Benchmark report generated: deposits/sec, distributions/sec
- Security checklist: 100% pass on access control, replay, upgrade safety
- `cargo test --test '*'` passes (all integration tests)

### Tests
- See Acceptance Criteria

### Rollback Plan
- Stop nctl: `nctl-stop`
- Delete deployed contracts from nctl state
- Re-run Phase 3

### Risk Analysis
- **MEDIUM RISK:** nctl network setup may fail on macOS → use Docker-based nctl
- **MEDIUM RISK:** Era progression in nctl may be slower than expected → use `nctl-increase-era` to fast-forward
- **LOW RISK:** Gas costs on nctl may differ from mainnet → mainnet gas costs are chainspec-fixed (2.5 CSPR for delegate), so this is deterministic

---

## PHASE 4 — Testnet Deployment

### Objectives
- Deploy all 5 contracts to Casper Testnet (NOT mainnet)
- Verify contracts on CSPR.live
- Store deployed contract hashes in `deployed-addresses.json` (committed to repo)
- Generate ABI / TypeScript types from deployed contracts
- Run smoke tests against testnet deployment

### Files
```
scripts/
├── deploy-testnet.sh                         (orchestrates deployment)
├── verify-testnet.sh                         (verifies on CSPR.live)
└── generate-abi.sh                           (generates TS types from contract schemas)
deployed/
└── addresses.json                            (committed; contains testnet contract hashes)
packages/
└── meridian-ts-types/                        (auto-generated TS types)
```

### Dependencies
- Phase 3 complete (all tests pass on local nctl)
- Deployer wallet funded with ≥ 500 CSPR on testnet

### Acceptance Criteria
- All 5 contracts deployed to `casper-test` testnet
- Every contract hash appears on `https://testnet.cspr.live`
- `deployed/addresses.json` committed with all 5 contract hashes + package hashes
- TypeScript types generated and published as `@meridian/ts-types` npm package (private)
- Smoke tests pass: issue a test MeridianToken, deposit CSPR, verify stake appears, verify era rewards accrue
- `scripts/verify-testnet.sh` exit code 0

### Tests
- Smoke test: `tests/integration/testnet_smoke.rs` runs against live testnet

### Rollback Plan
- Cannot truly "undo" a testnet deployment
- Mark deployed contracts as `DEPRECATED` in `addresses.json`
- Re-deploy with new contract package hashes
- Update `addresses.json` with new hashes

### Risk Analysis
- **HIGH RISK:** Testnet faucet rate limit (75 CSPR / 24h) — may take multiple days to fund deployer with sufficient CSPR. Mitigation: start funding in Phase 0.
- **MEDIUM RISK:** Testnet may be undergoing an upgrade — check `https://testnet.cspr.live/status` before deploying
- **LOW RISK:** Contract code may have a bug not caught in Phase 3 — Phase 3 must pass before this phase

---

## PHASE 5 — Backend

### Objectives
- Implement backend service (Node.js + TypeScript + Fastify or NestJS)
- PostgreSQL database with migrations
- Real event listener (subscribes to Sidecar SSE)
- Real blockchain synchronization (no mock RPC)
- Retry logic with exponential backoff
- Health checks
- Prometheus metrics

### Files
```
backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── config/
│   │   └── env.ts                            (loads + validates all ENV vars)
│   ├── db/
│   │   ├── client.ts                         (postgres pool)
│   │   ├── migrations/
│   │   │   ├── 001_create_tokens.sql
│   │   │   ├── 002_create_holders.sql
│   │   │   ├── 003_create_distributions.sql
│   │   │   ├── 004_create_events.sql
│   │   │   └── 005_create_audit_summaries.sql
│   │   └── repositories/
│   │       ├── token_repo.ts
│   │       ├── holder_repo.ts
│   │       ├── distribution_repo.ts
│   │       └── event_repo.ts
│   ├── casper/
│   │   ├── rpc_client.ts                     (calls https://node.cspr.cloud/rpc)
│   │   ├── sidecar_client.ts                 (subscribes to /events/stream)
│   │   ├── transaction_builder.ts            (uses casper-js-sdk v5.0.12 TransactionV1Builder)
│   │   └── signer.ts                         (loads agent keys from PEM files)
│   ├── indexer/
│   │   ├── event_listener.ts                 (SSE consumer → writes to DB)
│   │   ├── era_detector.ts                   (computes era_id from block_height)
│   │   └── sync_service.ts                   (backfill on restart)
│   ├── api/
│   │   ├── routes/
│   │   │   ├── tokens.ts
│   │   │   ├── holders.ts
│   │   │   ├── yields.ts
│   │   │   └── audit.ts
│   │   ├── auth.ts                           (API key auth for admin endpoints)
│   │   └── rate_limiter.ts
│   ├── metrics/
│   │   └── prometheus.ts
│   ├── health/
│   │   └── checks.ts
│   └── utils/
│       ├── retry.ts                          (exponential backoff)
│       └── logger.ts                         (pino)
└── tests/
    ├── unit/
    └── integration/
```

### Dependencies
- Phase 4 complete (testnet contracts deployed)
- PostgreSQL + Redis running

### Acceptance Criteria
- `npm run dev` starts backend on port 3000
- `npm run migrate` runs all migrations successfully
- Event listener connects to Sidecar SSE and writes events to PostgreSQL (verified by `SELECT COUNT(*) FROM events` > 0 after 5 minutes)
- Era detector correctly identifies era boundaries (verified by log messages)
- API endpoints return real data (no mocks):
  - `GET /tokens` returns list of issued MeridianTokens from DB (which was populated from chain events)
  - `GET /tokens/:id/yield` returns current APY computed from era rewards
  - `GET /holders/:address/compliance` returns compliance status from ComplianceRegistry
- Retry logic: simulate Sidecar disconnection, verify backend reconnects with exponential backoff
- Health check endpoint `GET /health` returns 200 with status of all dependencies (PostgreSQL, Redis, Sidecar, RPC)
- Prometheus metrics at `GET /metrics` include: events_indexed_total, transactions_submitted_total, era_distributions_total, rpc_errors_total

### Tests
- Unit tests for: era_detector, retry logic, transaction_builder
- Integration tests: event_listener against live Sidecar, API endpoints against real DB
- E2E test: issue token via API → deposit CSPR → verify event appears in DB → verify API returns updated state

### Rollback Plan
- Stop backend service
- Drop database: `npm run migrate:down`
- Delete indexed events
- Restart from clean DB

### Risk Analysis
- **HIGH RISK:** Sidecar SSE disconnections — must implement reconnect with exponential backoff and backfill missed events
- **HIGH RISK:** Race conditions in event indexing (events arriving out of order) — use block_height as monotonic ordering key; reject events with lower block_height than last indexed
- **MEDIUM RISK:** TransactionV1 signing via casper-js-sdk v5.0.12 — verify API surface matches docs (Finding A); use `TransactionV1Builder` not `DeployUtil`
- **MEDIUM RISK:** Agent key management — keys loaded from PEM files; ensure file permissions are 600; never log key contents
- **LOW RISK:** PostgreSQL connection pool exhaustion — use `pg` pool with max 10 connections

---

## PHASE 6 — AI Agents

### Objectives
- Implement 3 AI agents (YieldAgent, ComplianceAgent, AuditAgent) as TypeScript services
- Each agent uses real AI APIs (Claude, GPT-4o, Gemini)
- Each agent has primary + fallback model
- Each agent signs transactions via real Casper RPC
- Adversarial verification (AuditAgent reviews YieldAgent decisions)
- Health checks + restart logic
- Telegram operator alerts

### Files
```
agents/
├── package.json
├── tsconfig.json
├── src/
│   ├── shared/
│   │   ├── ai_client.ts                     (abstract LLM client; implementations for Anthropic, OpenAI, Google)
│   │   ├── casper_client.ts                  (uses casper-js-sdk v5.0.12)
│   │   ├── redis_pubsub.ts
│   │   ├── key_loader.ts
│   │   ├── health_check.ts
│   │   └── types.ts
│   ├── yield_agent/
│   │   ├── main.ts
│   │   ├── reasoning_loop.ts                (every era: read state, decide restake, sign tx, emit event)
│   │   ├── prompts/
│   │   │   ├── system_prompt.md
│   │   │   └── restake_decision.md
│   │   └── validator_curator.ts             (manages validator whitelist)
│   ├── compliance_agent/
│   │   ├── main.ts
│   │   ├── screening_loop.ts                (event-driven: on Transfer event, screen recipient)
│   │   ├── prompts/
│   │   │   ├── system_prompt.md
│   │   │   └── screening_decision.md
│   │   ├── sanctions_checker.ts             (OFAC + EU lists)
│   │   └── attestation_tracker.ts           (expiry tracking)
│   ├── audit_agent/
│   │   ├── main.ts
│   │   ├── audit_loop.ts                    (hourly: pull events, generate summary, sign, submit)
│   │   ├── adversarial_check.ts             (reviews YieldAgent decisions)
│   │   └── prompts/
│   │       ├── system_prompt.md
│   │       └── audit_summary.md
│   └── operator_alerts/
│       └── telegram_bot.ts
└── tests/
    ├── unit/
    └── integration/
```

### Dependencies
- Phase 5 complete (backend indexing events)
- AI API keys valid

### Acceptance Criteria
- All 3 agents start: `npm run start:yield-agent`, `npm run start:compliance-agent`, `npm run start:audit-agent`
- YieldAgent: every era (32 min on testnet), reads StakingVault state, makes restake decision via Claude (or GPT-4o fallback), signs TransactionV1, submits to RPC, emits CEP-88 event
- ComplianceAgent: subscribes to Transfer events, screens recipient via GPT-4o (or Claude fallback), if sanctions match → calls ComplianceRegistry.revoke() → emits CEP-88 event
- AuditAgent: every hour, pulls all CEP-88 events from last hour, generates summary via Gemini (or Claude Haiku fallback), signs, submits to MeridianAudit contract
- Adversarial verification: AuditAgent independently reviews every YieldAgent restake decision before it commits; if disagreement → block restake + Telegram alert to operator
- Health checks: each agent pings `GET /health` every 60s; 3 missed pings → Cloudflare Worker cron restart
- Telegram alerts: adversarial disagreements, agent crashes, low AI API quota
- Real AI calls only: NO mock LLM responses, NO mock transaction signing

### Tests
- Unit tests for: prompt rendering, decision parsing, key loading
- Integration tests:
  - YieldAgent: simulate era boundary, verify restake decision made, transaction signed, event emitted
  - ComplianceAgent: simulate Transfer event with sanctioned address, verify revoke transaction submitted
  - AuditAgent: simulate 1 hour of events, verify summary submitted to MeridianAudit contract
  - Adversarial: simulate YieldAgent making bad decision, verify AuditAgent blocks it
- E2E test: full lifecycle — issue token, deposit, YieldAgent restakes, ComplianceAgent revokes bad actor, AuditAgent summarizes

### Rollback Plan
- Stop all 3 agent services
- Agents are stateless (all state on chain) — no DB rollback needed
- Investigate logs, fix, restart

### Risk Analysis
- **HIGH RISK:** LLM hallucination produces invalid transaction — mitigated by contract-level whitelist (YieldAgent can only choose from pre-approved validators)
- **HIGH RISK:** AI API rate limits during multi-agent concurrent calls — implement per-agent rate limiter (1 call/sec max)
- **MEDIUM RISK:** Prompt injection via asset metadata — agents never read free-text user input; only structured on-chain state
- **MEDIUM RISK:** Agent key compromise — keys in Cloudflare Workers secrets (or local PEM files with 600 perms); rotation requires contract-level transaction
- **LOW RISK:** Model vendor outage — each agent has primary + fallback

---

## PHASE 7 — MCP Server + x402 Facilitator

### Objectives
- Implement Meridian MCP server (12 tools, stdio + HTTP modes, non-custodial)
- Publish as `@meridian/mcp` npm package
- Publish ClawHub skill: `meridian-mcp`
- Fork `odradev/casper-x402-poc` facilitator, customize for Meridian
- Implement 3 x402 loops (inbound query, outbound validator data, operational sanctions refresh)
- All x402 payments settled on Casper Testnet

### Files
```
mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts                             (stdio + HTTP modes)
│   ├── signer.ts                             (non-custodial; returns unsigned deploys)
│   ├── tools/
│   │   ├── get_token_info.ts
│   │   ├── get_yield_rate.ts
│   │   ├── get_holder_yield.ts
│   │   ├── get_compliance_status.ts
│   │   ├── subscribe_audit.ts                (x402-gated)
│   │   ├── list_validators.ts
│   │   ├── issue_token.ts
│   │   ├── transfer_token.ts
│   │   ├── register_holder.ts
│   │   ├── revoke_holder.ts
│   │   ├── restake.ts
│   │   └── distribute_rewards.ts
│   └── clawhub-skill/
│       └── SKILL.md                          (Claude Code skill definition)
└── tests/

x402-facilitator/
├── (forked from odradev/casper-x402-poc)
├── src/
│   ├── facilitator.rs                        (modified: settled against Meridian treasury)
│   ├── resource_server.rs                    (modified: serves yield_rate, audit_summary)
│   └── client.rs                             (modified: signs with agent keys)
├── .env.example
└── docker-compose.yml
```

### Dependencies
- Phase 5 complete (backend providing data)
- Phase 6 complete (agents running)

### Acceptance Criteria
- MCP server runs in stdio mode: `npx @meridian/mcp` (or `node dist/server.js --stdio`)
- MCP server runs in HTTP mode: `node dist/server.js --http --port 3002`
- All 12 tools work end-to-end:
  - Read tools return real data from backend / chain
  - Write tools return unsigned TransactionV1 (caller signs locally)
  - `subscribe_audit` returns 402 with x402 metadata when called without payment
- ClawHub skill installs: `npx clawhub@latest install meridian-mcp`
- x402 facilitator runs: `just docker-up` (starts facilitator + resource server)
- All 3 x402 loops work:
  - Loop 1: external agent calls `get_yield_rate` → 402 → signs EIP-712 → settles on testnet → 200 with yield data
  - Loop 2: YieldAgent calls external validator-monitor → 402 → pays → receives perf data
  - Loop 3: ComplianceAgent calls external sanctions API → 402 → pays → receives Merkle root
- All payments settled on Casper Testnet (verified via testnet.cspr.live transaction hash)

### Tests
- Unit tests for each MCP tool (mock the underlying backend, NOT the tool itself)
- Integration tests: MCP server + backend + testnet
- x402 tests: full payment flow against local nctl + testnet
- ClawHub skill test: install in fresh Claude Code, verify skill is recognized

### Rollback Plan
- Stop MCP server + x402 facilitator
- Unpublish npm package (or mark as deprecated)
- Remove ClawHub skill listing

### Risk Analysis
- **HIGH RISK:** x402 facilitator integration with Casper 2.0 (was built for 1.x) — verify `odradev/casper-x402-poc` works on Casper 2.0 before customization
- **HIGH RISK:** EIP-712 typed-data signing compatibility — use `casper-eip-712` v1.2.0 with `casper-native` feature; verify domain separator format
- **MEDIUM RISK:** MCP protocol version compatibility — pin to `2024-11-05` (matches cspr-trade-mcp)
- **LOW RISK:** ClawHub marketplace listing — manual submission process; allow 24-48h for approval

---

## PHASE 8 — Frontend

### Objectives
- Implement Next.js 16 + Tailwind 4 + shadcn/ui dApp
- CSPR.click v1.9.0+ wallet integration (no direct Casper Wallet)
- Every number on screen comes from backend or chain (NO mock data)
- Every wallet action executes real TransactionV1
- Every chart uses real indexed data from backend
- Every button tested

### Files
```
frontend/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx                              (landing)
│   ├── issue/
│   │   └── page.tsx                          (issuer flow)
│   ├── dashboard/
│   │   └── page.tsx                          (holder dashboard)
│   ├── audit/
│   │   └── page.tsx                          (audit trail)
│   └── api/                                  (proxy to backend, never expose API keys)
├── components/
│   ├── WalletConnect.tsx                     (CSPR.click integration)
│   ├── TokenIssueForm.tsx
│   ├── StakingPanel.tsx
│   ├── YieldChart.tsx                        (uses real indexed data)
│   ├── ComplianceBadge.tsx
│   ├── AuditTrail.tsx
│   └── ui/                                   (shadcn/ui components)
├── lib/
│   ├── csprclick.ts                          (CSPR.click SDK init)
│   ├── api.ts                                (backend API client)
│   ├── casper.ts                             (casper-js-sdk v5.0.12 helpers)
│   └── types.ts
└── tests/
    ├── unit/                                 (vitest)
    └── e2e/                                  (playwright)
```

### Dependencies
- Phase 5 complete (backend API)
- Phase 4 complete (contract addresses available)

### Acceptance Criteria
- `npm run dev` starts frontend on port 3001
- Landing page loads with real protocol stats (total CSPR staked, total holders, current APY) — all from backend API
- WalletConnect button works: connects via CSPR.click, shows connected address
- Issue page: issuer fills form, clicks "Issue Token", CSPR.click opens signing modal, TransactionV1 signed + submitted, transaction hash shown, page polls until confirmed, new token appears in dashboard
- Dashboard: holder sees their MeridianToken balance, pending yield (real-time updated from backend), compliance status, full audit trail
- YieldChart: renders real era-by-era yield data from backend `/yields/:tokenId/history` endpoint
- AuditTrail: renders real CEP-88 events from backend
- Every button has playwright e2e test
- No mock data anywhere in the frontend (grep for "mock", "fake", "placeholder" returns 0 hits)
- Lighthouse score ≥ 90 on all 4 metrics (Performance, Accessibility, Best Practices, SEO)

### Tests
- Unit tests (vitest): every component
- E2E tests (playwright): full user flows (connect wallet, issue token, view dashboard, view audit)
- Visual regression tests: screenshot every page, compare to baseline

### Rollback Plan
- Stop frontend
- Revert to previous deployment (Vercel/Netlify auto-deploy from git)
- Investigate, fix, re-deploy

### Risk Analysis
- **HIGH RISK:** CSPR.click v1.9.0 API may differ from docs — verify by building a minimal test app first
- **MEDIUM RISK:** casper-js-sdk v5.0.12 in browser — verify WASM bundle works in Next.js 16
- **MEDIUM RISK:** CORS issues calling backend API from browser — backend must set `Access-Control-Allow-Origin` for frontend domain
- **LOW RISK:** Tailwind 4 + shadcn/ui compatibility — both stable

---

## PHASE 9 — Integration

### Objectives
- End-to-end integration test: frontend → backend → contracts → agents → MCP → x402
- Multi-agent scenario: portfolio agent (simulated) pays x402 to read Meridian yield, makes investment decision
- Full lifecycle: issue → stake → distribute → comply → audit → x402 query from external agent
- Performance test: 100 concurrent deposits, 10 era distributions, 1000 x402 queries

### Files
```
tests/
├── e2e/
│   ├── full_lifecycle.spec.ts                (playwright: browser → backend → chain)
│   ├── multi_agent_scenario.spec.ts          (simulated portfolio agent + Meridian)
│   └── x402_query_flow.spec.ts               (external agent pays x402)
└── performance/
    ├── deposit_load.rs                       (100 concurrent deposits)
    ├── distribution_load.rs                  (10 era distributions)
    └── x402_query_load.ts                    (1000 x402 queries)
```

### Dependencies
- All previous phases complete

### Acceptance Criteria
- `tests/e2e/full_lifecycle.spec.ts` passes: 90-second demo script executes end-to-end against testnet
- `tests/e2e/multi_agent_scenario.spec.ts` passes: simulated portfolio agent queries Meridian MCP, pays x402, receives yield data, adds token to (simulated) portfolio
- `tests/e2e/x402_query_flow.spec.ts` passes: 100 x402 queries succeed, 100 payments settle on testnet
- Performance tests meet thresholds:
  - 100 concurrent deposits: all succeed within 60 seconds
  - 10 era distributions: all succeed within 10 minutes
  - 1000 x402 queries: 95th percentile latency < 2 seconds

### Tests
- See Acceptance Criteria

### Rollback Plan
- Stop all services
- Clean testnet state (mark issued tokens as test)
- Re-run integration after fixes

### Risk Analysis
- **HIGH RISK:** Testnet rate limits may throttle performance tests — schedule tests in off-peak hours
- **MEDIUM RISK:** Multi-agent scenario requires simulated external agent — must NOT mock x402; must make real HTTP calls with real EIP-712 signatures
- **LOW RISK:** Era timing on testnet may be slow (32 min) — use nctl for performance tests, testnet for e2e

---

## PHASE 10 — Production QA

### Objectives
- Security review (manual + automated)
- Gas analysis report (final, against testnet)
- Benchmark report (final)
- Documentation complete (RUNBOOK.md, API.md, ARCHITECTURE.md)
- Demo video recorded (90 seconds, embedded in README)
- Hackathon submission package ready

### Files
```
docs/
├── RUNBOOK.md                                (operator runbook)
├── API.md                                    (backend API reference)
├── ARCHITECTURE.md                           (system architecture)
├── SECURITY.md                               (threat model + mitigations)
├── GAS_ANALYSIS.md                           (cost of every operation)
├── BENCHMARKS.md                             (throughput numbers)
└── DEMO_SCRIPT.md                            (90-second demo script)
demos/
└── video/
    └── meridian-demo.mp4                     (90 seconds)
```

### Dependencies
- All previous phases complete

### Acceptance Criteria
- Security review: 0 critical, 0 high, ≤ 3 medium findings (all mitigated)
- Gas analysis: every operation's CSPR cost documented and within budget (≤ 5 CSPR per user-facing operation)
- Benchmarks: all performance thresholds met
- RUNBOOK.md: operator can deploy + monitor + troubleshoot using only this doc
- API.md: every endpoint documented with request/response examples
- ARCHITECTURE.md: every component documented with diagram
- Demo video: 90 seconds, shows all 5 demo moments (Section 18 of strategy dossier)
- Hackathon submission: GitHub repo public, DoraHacks BUIDL updated, demo video uploaded

### Tests
- `cargo audit` returns 0 vulnerabilities
- `npm audit` returns 0 vulnerabilities
- `cargo clippy --workspace -- -D warnings` returns 0 warnings
- `eslint . --max-warnings 0` returns 0 warnings
- Manual security review by 1 reviewer (checklist in docs/SECURITY.md)

### Rollback Plan
- N/A (final phase; no rollback)
- If critical issues found: fix → re-run QA → re-submit

### Risk Analysis
- **MEDIUM RISK:** Security review may find issues requiring contract redeployment — Phase 4 rollback plan covers this
- **MEDIUM RISK:** Demo video may fail to capture live testnet transactions — pre-record + have live demo as backup
- **LOW RISK:** Documentation incomplete — allocate 1 full day for docs

---

# PART 6 — STRICT EXECUTION

## 6.1 Per-Phase Execution Checklist

At the end of EVERY phase, Cursor MUST run ALL of the following in order. ANY failure BLOCKS phase completion.

```bash
# 1. Format check
cargo fmt --check
npm run format:check

# 2. Lint (zero warnings allowed)
cargo clippy --workspace --all-targets -- -D warnings
npm run lint -- --max-warnings 0

# 3. Unit tests
cargo test --workspace
npm run test:unit

# 4. Integration tests
cargo test --test '*'
npm run test:integration

# 5. End-to-end tests (only if phase includes e2e)
npm run test:e2e

# 6. Security tests
cargo test --test security
npm run test:security

# 7. Gas analysis (only for contract phases)
cargo test --test gas_analysis -- --nocapture

# 8. Benchmarks (only for phases that include benchmarks)
cargo bench

# 9. Deployment dry-run (only for deployment phases)
./scripts/deploy-testnet.sh --dry-run

# 10. Dependency audit
cargo audit
npm audit --audit-level=moderate

# 11. Outdated dependency check (must be 0)
cargo outdated --root
npm outdated
```

## 6.2 PHASE_REPORT.md Template

Every phase MUST produce `PHASE_REPORT.md` at the repo root. Template:

```markdown
# Phase N Report — [Phase Name]

**Date:** YYYY-MM-DD
**Cursor Session ID:** [from Cursor]
**Phase Status:** ✅ Complete / ❌ Blocked / ⚠️ Partial

## Objectives
- (copied from FINAL_PROMPT.md)

## Acceptance Criteria
| Criterion | Status | Evidence |
|---|---|---|
| (criterion 1) | ✅/❌ | (link to test output, transaction hash, etc.) |
| (criterion 2) | ✅/❌ | ... |

## Tests Run
| Test | Result | Duration | Output |
|---|---|---|---|
| cargo fmt --check | PASS/FAIL | Xs | (link) |
| cargo clippy | PASS/FAIL | Xs | (link) |
| cargo test --workspace | PASS/FAIL | Xs | (link) |
| integration tests | PASS/FAIL | Xs | (link) |
| e2e tests | PASS/FAIL | Xs | (link) |
| security tests | PASS/FAIL | Xs | (link) |
| gas analysis | PASS/FAIL | Xs | (link) |
| benchmarks | PASS/FAIL | Xs | (link) |
| deployment dry-run | PASS/FAIL | Xs | (link) |
| cargo audit | PASS/FAIL | Xs | (link) |
| npm audit | PASS/FAIL | Xs | (link) |

## Files Created / Modified
- (list of files, with line counts)

## Testnet Transactions (if applicable)
- (list of transaction hashes, with descriptions)

## Issues Encountered
- (any issues, how they were resolved)

## Deviations from FINAL_PROMPT.md
- (any deviations, with justification)

## Rollback Plan
- (how to undo this phase if needed)

## Next Phase Readiness
- [ ] All acceptance criteria met
- [ ] All tests pass
- [ ] No blocking issues
- [ ] Ready for human approval

## Human Approval
- [ ] Approved by: _______________
- [ ] Approval date: _______________
- [ ] Comments: _______________
```

## 6.3 Approval Workflow

1. Cursor completes Phase N
2. Cursor runs all checks from §6.1
3. Cursor generates `PHASE_REPORT.md`
4. Cursor STOPS. Does NOT start Phase N+1.
5. Human reviews `PHASE_REPORT.md`
6. Human either:
   - Approves → Cursor proceeds to Phase N+1
   - Requests changes → Cursor addresses feedback, re-runs checks, re-generates `PHASE_REPORT.md`
7. Repeat until approval

**NEVER auto-continue. NEVER skip approval. NEVER mark a phase complete without all acceptance criteria met.**

---

# PART 7 — SMART CONTRACT QUALITY

## 7.1 Per-Contract Quality Checklist

Every contract MUST satisfy ALL of the following before being considered complete:

### Compilation
- [ ] `cargo odra build` succeeds without warnings
- [ ] WASM file produced in `wasm/` directory
- [ ] Contract size < 200 KB (Casper limit)

### Testing
- [ ] Unit tests for every public function
- [ ] Property tests (`proptest`) for invariants
- [ ] Fuzz tests (`cargo-fuzz`) for entry-point arguments
- [ ] Edge cases: zero values, max values, empty arrays, duplicates
- [ ] Overflow tests: U512 arithmetic boundaries (use `checked_add`, `checked_mul`)
- [ ] Permission tests: every access-controlled entry point reverts when called by unauthorized account
- [ ] Upgrade tests: `upgrade()` preserves state
- [ ] Event tests: every state change emits correct CEP-88 event with correct fields
- [ ] Deployment tests: contract installs successfully on nctl + testnet
- [ ] Integration tests: cross-contract calls work (e.g. StakingVault → system auction)

### Code Quality
- [ ] No `// TODO` comments
- [ ] No `unimplemented!()` macros
- [ ] No `panic!("not yet")`
- [ ] No stub functions
- [ ] No hardcoded values (use constants at top of file)
- [ ] No `unwrap()` or `expect()` in production paths (use proper error handling)
- [ ] Every public function has rustdoc
- [ ] Every entry point has access control comment

### Security
- [ ] Manual security review (checklist in docs/SECURITY.md)
- [ ] `cargo audit` passes
- [ ] No known vulnerability patterns (reentrancy, integer overflow, access control bypass)
- [ ] Replay protection on all agent-submitted transactions (EIP-712 nonce + validity window)
- [ ] Timelock on governance actions (24h for compliance rule changes)

### Documentation
- [ ] README.md in contract directory
- [ ] Architecture comment at top of lib.rs
- [ ] Every entry point documented with: purpose, access control, args, return value, events emitted


---

# PART 8 — BACKEND

## 8.1 Backend Rules (NON-NEGOTIABLE)

1. **No mock APIs.** Every API endpoint returns real data from PostgreSQL or real-time chain queries.
2. **No fake databases.** Use real PostgreSQL 15+ with real migrations. No SQLite for production paths (SQLite acceptable only for local dev with explicit `if (process.env.NODE_ENV === 'development')` guard).
3. **Real auth.** API key auth for admin endpoints; JWT for user-facing endpoints. No `auth: true` stubs.
4. **Real event listeners.** Backend subscribes to Sidecar SSE (`/events/stream`). On disconnection, exponential backoff retry. On reconnect, backfill missed events using block_height as the cursor.
5. **Real indexing.** Every CEP-88 event is written to PostgreSQL within 5 seconds of on-chain confirmation. Indexed events are the source of truth for all API responses.
6. **Real blockchain synchronization.** On startup, backend queries the last indexed block_height from DB, then queries chain from that height forward. Never assume DB is current.
7. **Retry logic.** Every external call (RPC, AI API, Sidecar) wraps in a retry with exponential backoff (initial 1s, max 60s, max 5 attempts). Failed retries emit Prometheus metric + log.
8. **Health checks.** `GET /health` returns 200 only if ALL dependencies are reachable:
   - PostgreSQL: `SELECT 1` succeeds
   - Redis: `PING` returns PONG
   - Sidecar: `GET /health` returns 200
   - RPC: `info_get_status` returns success
   - If ANY dependency fails, `GET /health` returns 503 with details
9. **Metrics.** Prometheus metrics at `GET /metrics`. Mandatory metrics:
   - `meridian_events_indexed_total` (counter)
   - `meridian_transactions_submitted_total` (counter, labeled by type)
   - `meridian_era_distributions_total` (counter)
   - `meridian_rpc_errors_total` (counter, labeled by endpoint)
   - `meridian_indexer_lag_blocks` (gauge — current chain height minus last indexed height)
   - `meridian_active_holders` (gauge)
   - `meridian_total_staked_cspr` (gauge)
10. **Logging.** Structured JSON logs (pino). Log levels: debug, info, warn, error. Never log: private keys, API keys, user PII. Always log: transaction hashes, block heights, era IDs, agent decisions.

## 8.2 Backend Stack (Pinned)

```json
{
  "dependencies": {
    "fastify": "=4.28.1",
    "@fastify/cors": "=9.0.1",
    "@fastify/rate-limit": "=9.1.0",
    "@fastify/helmet": "=11.0.0",
    "pg": "=8.12.0",
    "ioredis": "=5.4.1",
    "casper-js-sdk": "5.0.12",
    "@make-software/csprclick-sdk": "1.9.0",
    "pino": "=9.3.2",
    "prom-client": "=15.1.3",
    "zod": "=3.23.8"
  },
  "devDependencies": {
    "typescript": "=5.5.4",
    "vitest": "=2.0.5",
    "@types/node": "=20.14.14",
    "@types/pg": "=8.11.6",
    "tsx": "=4.16.5"
  }
}
```

---

# PART 9 — FRONTEND

## 9.1 Frontend Rules (NON-NEGOTIABLE)

1. **No mock UI.** Every page renders real data from backend API or real-time chain queries.
2. **Every number comes from blockchain or backend.** No hardcoded balances, no hardcoded APYs, no hardcoded holder counts. If a number is shown, it must come from `GET /api/*` or a real-time RPC query.
3. **Every wallet action executes real transactions.** "Issue Token" button → calls `issue_token` MCP tool → CSPR.click opens signing modal → real TransactionV1 signed → real RPC submission → real transaction hash → poll until confirmed → UI updates.
4. **Every chart uses real indexed data.** YieldChart renders `/api/yields/:tokenId/history` (real era-by-era data). No `Math.random()` anywhere.
5. **Every button tested.** Playwright e2e test for every button on every page. No untested user flows.
6. **No placeholder pages.** No "Coming Soon" pages. No "Under Construction" pages. Every route either has real functionality or returns 404.
7. **No console.log in production.** Use structured logging service (e.g. Sentry) for production. Console.log only in development.
8. **No `any` types in TypeScript.** Every type must be explicit. ESLint rule `@typescript-eslint/no-explicit-any` set to `error`.

## 9.2 Frontend Stack (Pinned)

```json
{
  "dependencies": {
    "next": "16.0.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@make-software/csprclick-sdk": "1.9.0",
    "@make-software/csprclick-react": "1.9.0",
    "casper-js-sdk": "5.0.12",
    "tailwindcss": "4.0.0",
    "@radix-ui/react-dialog": "1.1.1",
    "@radix-ui/react-tabs": "1.1.0",
    "lucide-react": "0.427.0",
    "recharts": "2.12.7",
    "swr": "2.2.5",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "vitest": "2.0.5",
    "@playwright/test": "1.46.0",
    "eslint": "9.9.0",
    "@typescript-eslint/eslint-plugin": "8.0.1"
  }
}
```

## 9.3 CSPR.click Integration Pattern

```typescript
// lib/csprclick.ts
import { CsprClickSDK, WalletType } from '@make-software/csprclick-sdk'

export const csprClick = new CsprClickSDK({
  network: process.env.NEXT_PUBLIC_CASPER_NETWORK as 'casper-test' | 'casper',
  appName: 'Meridian',
  userEmail: '', // optional
})

// components/WalletConnect.tsx
'use client'
import { useEffect, useState } from 'react'
import { csprClick } from '@/lib/csprclick'

export function WalletConnect() {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    csprClick.onConnected((activeKey) => {
      setConnected(true)
      setAddress(activeKey)
    })
    csprClick.onDisconnected(() => {
      setConnected(false)
      setAddress(null)
    })
  }, [])

  const handleConnect = async () => {
    await csprClick.connect() // opens wallet selector
  }

  const handleDisconnect = async () => {
    await csprClick.disconnect()
  }

  return connected ? (
    <div>
      <span>{address?.slice(0, 8)}...{address?.slice(-6)}</span>
      <button onClick={handleDisconnect}>Disconnect</button>
    </div>
  ) : (
    <button onClick={handleConnect}>Connect Wallet</button>
  )
}
```

## 9.4 Real Transaction Submission Pattern

```typescript
// components/TokenIssueForm.tsx
'use client'
import { csprClick } from '@/lib/csprclick'
import { useState } from 'react'

export function TokenIssueForm() {
  const [submitting, setSubmitting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleIssue = async (formData: IssueFormData) => {
    setSubmitting(true)
    try {
      // 1. Call backend to build unsigned transaction
      const buildRes = await fetch('/api/tokens/build-issue', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const { unsignedTx, deployArgs } = await buildRes.json()

      // 2. Sign via CSPR.click (real wallet signing)
      const signedTx = await csprClick.sign(unsignedTx)

      // 3. Submit via backend (which submits to RPC)
      const submitRes = await fetch('/api/tokens/submit', {
        method: 'POST',
        body: JSON.stringify({ signedTx }),
      })
      const { transactionHash } = await submitRes.json()
      setTxHash(transactionHash)

      // 4. Poll for confirmation
      const confirmed = await pollTransaction(transactionHash)
      if (confirmed) {
        // 5. Refresh UI state from backend (which has indexed the event)
        window.location.reload()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (/* form JSX */)
}
```

---

# PART 10 — AI

## 10.1 AI Rules (NON-NEGOTIABLE)

1. **Every AI component uses real APIs.** Claude (Anthropic), GPT-4o (OpenAI), Gemini (Google). No mock LLM responses, no fake tool outputs.
2. **Every tool call works.** Agents call real MCP tools, real Casper RPC, real backend APIs. No "tool not implemented" errors.
3. **Every MCP tool verified.** Before an agent uses an MCP tool, the tool must have a passing integration test in `mcp-server/tests/`.
4. **Every prompt tested.** Prompts are version-controlled in `agents/*/prompts/`. Each prompt has a test case in `agents/*/tests/prompt_tests/` that verifies the prompt produces a parseable response for known inputs.
5. **No free-text user input to LLMs.** Agents only consume structured on-chain state (block heights, balances, event payloads). Asset metadata is hashed, not passed raw. This prevents prompt injection.
6. **Adversarial verification.** Every YieldAgent restake decision is independently reviewed by AuditAgent using a different LLM. Disagreement blocks the action and triggers Telegram alert.
7. **Model fallback.** Each agent has primary + fallback model. If primary fails (API error, rate limit), fallback is used. If both fail, agent enters degraded mode (no new decisions, but continues emitting health events).
8. **Reproducibility.** Every agent decision is recorded with: timestamp, model used, prompt hash, input state hash, output decision, signature. Stored on-chain as CEP-88 event.
9. **Rate limiting.** Per-agent rate limiter: max 1 LLM call per second, max 60 per minute. Prevents API quota exhaustion.
10. **Cost tracking.** Every LLM call logs token count + estimated cost. Daily cost report emitted to Prometheus.

## 10.2 AI Stack (Pinned)

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "0.27.3",
    "openai": "4.56.0",
    "@google/generative-ai": "0.17.1",
    "casper-js-sdk": "5.0.12",
    "ioredis": "5.4.1",
    "pino": "9.3.2",
    "zod": "3.23.8",
    "dotenv": "16.4.5"
  }
}
```

## 10.3 YieldAgent Decision Schema (Zod)

```typescript
// agents/yield_agent/src/schema.ts
import { z } from 'zod'

export const RestakeDecision = z.object({
  decision: z.enum(['restake', 'hold']),
  reason: z.string().min(10).max(500),
  current_allocation: z.array(z.object({
    validator: z.string(),
    amount_cspr: z.number(),
    apy_percent: z.number(),
  })),
  proposed_allocation: z.array(z.object({
    validator: z.string(),
    amount_cspr: z.number(),
    expected_apy_percent: z.number(),
  })).optional(),
  expected_apy_improvement_bps: z.number().optional(),
})

export type RestakeDecision = z.infer<typeof RestakeDecision>
```

The YieldAgent's LLM output is parsed against this schema. If parsing fails, the decision is rejected and the agent falls back to "hold" + emits an error event.

---

# PART 11 — DEPLOYMENT

## 11.1 Deployment Pipeline

```
1. Deploy contracts to testnet (Phase 4)
   ├── Run scripts/deploy-testnet.sh
   ├── Verify each contract on testnet.cspr.live
   ├── Save hashes to deployed/addresses.json
   └── Commit addresses.json to repo

2. Generate TypeScript types from contract schemas
   ├── Run scripts/generate-abi.sh
   ├── Produces packages/meridian-ts-types/
   └── Publish as private npm package

3. Update frontend with new contract addresses
   ├── Read deployed/addresses.json
   ├── Update NEXT_PUBLIC_MERIDIAN_CONTRACT_PACKAGE_HASH in .env
   └── Rebuild frontend

4. Deploy backend
   ├── Run database migrations: npm run migrate
   ├── Start backend service: npm run start
   ├── Verify GET /health returns 200
   └── Verify event listener is indexing

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

## 11.2 Contract Verification

After deployment, every contract MUST be verifiable on CSPR.live:

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

## 11.3 Contract Address Storage

`deployed/addresses.json` (committed to repo):

```json
{
  "network": "casper-test",
  "deployed_at": "2026-07-XX",
  "deployer_public_key": "0x...",
  "contracts": {
    "meridian_token": {
      "package_hash": "0x...",
      "contract_hash": "0x...",
      "deploy_hash": "0x...",
      "wasm_hash": "0x..."
    },
    "staking_vault": { ... },
    "compliance_registry": { ... },
    "yield_distributor": { ... },
    "meridian_audit": { ... }
  },
  "agent_keys": {
    "yield_agent_public_key": "0x...",
    "compliance_agent_public_key": "0x...",
    "audit_agent_public_key": "0x..."
  }
}
```

## 11.4 Smoke Test Script

```bash
#!/bin/bash
# scripts/smoke-test.sh
set -euo pipefail

echo "=== Meridian Smoke Test ==="

# 1. Issue a test token
echo "1. Issuing test token..."
ISSUE_TX=$(curl -X POST http://localhost:3000/api/tokens/issue \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {"name": "Smoke Test Fund", "isin": "SMOKE-001"},
    "total_supply": 1000,
    "initial_stake_cspr": 100,
    "compliance_rules": {"max_holders": 100, "require_accreditation": false}
  }' | jq -r '.transaction_hash')
echo "   Issue tx: $ISSUE_TX"

# Wait for confirmation
sleep 30

# 2. Verify token appears in backend
TOKEN_ID=$(curl http://localhost:3000/api/tokens | jq -r '.tokens[0].id')
echo "2. Token ID: $TOKEN_ID"

# 3. Verify stake is visible
STAKE=$(curl http://localhost:3000/api/tokens/$TOKEN_ID/stake | jq -r '.stake_amount_cspr')
echo "3. Stake: $STAKE CSPR"
[ "$STAKE" = "100" ] || { echo "FAIL: stake mismatch"; exit 1; }

# 4. Wait for era + verify yield distribution
echo "4. Waiting for era boundary (32 min)..."
sleep 1920

DISTRIBUTED=$(curl http://localhost:3000/api/tokens/$TOKEN_ID/distributions | jq -r '.distributions | length')
echo "   Distributions: $DISTRIBUTED"
[ "$DISTRIBUTED" -ge 1 ] || { echo "FAIL: no distributions"; exit 1; }

# 5. Verify audit summary
SUMMARIES=$(curl http://localhost:3000/api/audit/summaries | jq -r '.summaries | length')
echo "5. Audit summaries: $SUMMARIES"
[ "$SUMMARIES" -ge 1 ] || { echo "FAIL: no audit summaries"; exit 1; }

echo "=== Smoke test PASSED ==="
```

---

# PART 12 — QUALITY GATE

## 12.1 Definition of Done

Nothing is considered complete unless ALL of the following are true:

### Build
- [ ] 100% build success (`cargo build --workspace` + `npm run build` both exit 0)
- [ ] 0 build warnings

### Tests
- [ ] 100% unit tests pass (`cargo test` + `npm run test:unit`)
- [ ] 100% integration tests pass (`cargo test --test '*'` + `npm run test:integration`)
- [ ] 100% e2e tests pass (`npm run test:e2e`)
- [ ] 100% security tests pass
- [ ] Test coverage ≥ 80% for Rust contracts
- [ ] Test coverage ≥ 70% for TypeScript (backend + agents + frontend)

### Code Quality
- [ ] No mock data (grep for "mock", "fake", "placeholder" in src/ returns 0 hits)
- [ ] No demo code (no `if (process.env.DEMO_MODE)` branches)
- [ ] No placeholders (no `// TODO`, no `unimplemented!()`, no `panic!("not yet")`)
- [ ] No warnings from `cargo clippy -- -D warnings`
- [ ] No warnings from `eslint --max-warnings 0`
- [ ] No `any` types in TypeScript
- [ ] No `unwrap()` or `expect()` in Rust production paths

### Dependencies
- [ ] No deprecated APIs in dependency tree (`cargo audit` + `npm audit`)
- [ ] No outdated SDKs (`cargo outdated` + `npm outdated` return 0)
- [ ] All dependencies pinned to exact versions

### Documentation
- [ ] README.md exists and is accurate
- [ ] RUNBOOK.md exists and operator can deploy + monitor using only it
- [ ] API.md exists with every endpoint documented
- [ ] ARCHITECTURE.md exists with system diagram
- [ ] SECURITY.md exists with threat model
- [ ] Every public function has rustdoc / TSDoc

### Deployment
- [ ] All 5 contracts deployed to testnet
- [ ] All contracts verified on CSPR.live
- [ ] Backend deployed and responding to /health
- [ ] All 3 agents running and emitting events
- [ ] MCP server running and responding to tool list
- [ ] x402 facilitator running and responding to /health
- [ ] Frontend deployed and wallet connects
- [ ] Smoke test passes

### Hackathon Submission
- [ ] GitHub repo is public
- [ ] README.md has Quick Start, Architecture, Demo sections
- [ ] Demo video (90 seconds) uploaded to YouTube unlisted + IPFS
- [ ] DoraHacks BUIDL updated with all links
- [ ] `deployed/addresses.json` committed with testnet hashes

## 12.2 Failure Handling

If ANY criterion fails:
1. Phase is marked as ❌ Blocked in `PHASE_REPORT.md`
2. Cursor STOPS. Does not proceed to next phase.
3. Human is notified (via Telegram alert if configured).
4. Root cause is identified.
5. Fix is implemented.
6. ALL checks are re-run from the beginning of the phase.
7. New `PHASE_REPORT.md` is generated.
8. Human re-approves.

**No partial completions. No "mostly done". No "will fix later". Done means done.**

---

# PART 13 — CURSOR EXECUTION PROMPTS

Copy-paste these prompts into Cursor one at a time. Each prompt instructs Cursor to execute exactly one phase.

## Phase 0 Prompt — Research Validation

```
Read /home/z/my-project/download/meridian-cursor-os/FINAL_PROMPT.md in full.
Read /home/z/my-project/download/meridian-cursor-os/ENVIRONMENT_REQUIREMENTS.md.
Read /home/z/my-project/download/meridian-cursor-os/USER_ACTIONS.md and confirm every action is complete.

Your task: Execute ONLY Phase 0 (Research Validation) from FINAL_PROMPT.md.

Specifically:
1. Re-verify every URL in Part 1 of FINAL_PROMPT.md returns 200 OK. If any URL fails, document it and search for the new official URL.
2. Verify Contract Access to Auction API surface by cloning https://github.com/casper-network/casper-node, checking out tag v2.2.1, and reading smart_contracts/contracts/client/delegate/src/main.rs. Confirm the pattern matches what is documented in Part 2 of FINAL_PROMPT.md.
3. Run the install commands from Part 1 and confirm versions:
   - cargo-odra 0.1.7
   - casper-client 5.0.1
   - just ≥ 1.40.0
   - rustc ≥ 1.85.0
4. Run ./scripts/verify-env.sh and confirm all 10 checks pass.
5. Re-fetch https://docs.casper.network and https://odra.dev/docs to confirm no API surface has changed since 2026-06-28.

DO NOT write any code. DO NOT scaffold the repo. DO NOT start Phase 1.

Output: research-validation-report.md documenting every verification, every URL checked, every version confirmed, every discrepancy found.

Then: Generate PHASE_REPORT.md using the template in Part 6.2 of FINAL_PROMPT.md.

STOP. Wait for my approval before starting Phase 1.
```

## Phase 1 Prompt — Environment Setup

```
Read FINAL_PROMPT.md, ENVIRONMENT_REQUIREMENTS.md, USER_ACTIONS.md, and the Phase 0 PHASE_REPORT.md (which I have approved).

Your task: Execute ONLY Phase 1 (Environment Setup) from FINAL_PROMPT.md.

Specifically:
1. Scaffold the monorepo structure exactly as specified in Phase 1 of FINAL_PROMPT.md.
2. Generate Cargo.toml (workspace) with all dependencies pinned to exact versions per Part 1 + Part 8 of FINAL_PROMPT.md.
3. Generate package.json files (root + each workspace) with all npm dependencies pinned.
4. Generate rust-toolchain.toml pinning Rust 1.85+ stable + wasm32-unknown-unknown target.
5. Generate justfile with targets: bootstrap, build, test, lint, fmt, migrate, deploy-testnet, verify-env.
6. Generate .env.example from ENVIRONMENT_REQUIREMENTS.md.
7. Generate scripts/verify-env.sh implementing all 10 verification checks.
8. Generate scripts/bootstrap.sh that installs every dependency on a clean machine.
9. Generate docker-compose.yml with PostgreSQL 15 + Redis 7 + nctl.
10. Generate .github/workflows/ci.yml that runs fmt + clippy + test on every push.
11. Copy FINAL_PROMPT.md, ENVIRONMENT_REQUIREMENTS.md, USER_ACTIONS.md into docs/ directory.

DO NOT write any contract code, agent code, MCP code, or frontend code. That is Phase 2+.

Run the following and confirm all pass:
- just bootstrap
- cargo build --workspace
- npm install
- docker-compose up -d postgres redis (verify health)
- ./scripts/verify-env.sh (all 10 checks pass)

Output: PHASE_REPORT.md using the template in Part 6.2.

STOP. Wait for my approval before starting Phase 2.
```

## Phase 2 Prompt — Smart Contracts

```
Read FINAL_PROMPT.md (especially Part 2 Audit Findings, Part 5 Phase 2, Part 7 Smart Contract Quality) and the Phase 1 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 2 (Smart Contracts).

Specifically, implement these 5 Odra 2.8.1 contracts with NO stubs, NO TODOs, NO placeholders:

1. contracts/meridian-token/ — ERC-3643 + native yield extension (CEP-18 v1.2.0 base + compliance hooks + yield accrual)
2. contracts/staking-vault/ — Holds CSPR, calls system auction via runtime::call_subcall(system::get_auction(), auction::METHOD_DELEGATE, args). Uses deposit pattern (contract's own main purse).
3. contracts/compliance-registry/ — Pluggable ComplianceRules engine, register_holder, revoke, reinstate, is_compliant, with sanctions list Merkle root storage.
4. contracts/yield-distributor/ — Era-based distribution, pro-rata to qualified holders, non-compliant shares accrue to treasury. Uses checked arithmetic.
5. contracts/meridian-audit/ — Stores AuditAgent summary hashes.

CRITICAL REQUIREMENTS (from Part 2 Audit Findings):
- Finding A: Use TransactionV1, NOT Deploy
- Finding B: Use runtime::call_subcall for cross-contract calls (verify against casper-node source if uncertain)
- Finding C: Use system::get_auction() at runtime, NEVER hardcode auction hash
- Finding F: CEP-18 v1.2.0 base, CEP-78 v1.5.1+ if used
- Finding K: Handle CEP-90 forced undelegation in StakingVault
- Finding L: Pin odra = "=2.8.1" in Cargo.toml
- Finding M: rust-toolchain.toml already pins stable + wasm32-unknown-unknown
- Finding P: StakingVault uses deposit pattern (user deposits CSPR into vault, vault delegates on its own behalf)

For each contract, implement:
- src/lib.rs (full implementation)
- src/error.rs (typed errors)
- src/event.rs (CEP-88 event definitions)
- tests/unit.rs (unit tests for every public function)
- tests/property_tests.rs (proptest for invariants)
- tests/fuzz_targets.rs (cargo-fuzz targets)
- tests/edge_cases.rs (zero, max, empty, duplicate cases)
- tests/overflow_tests.rs (U512 arithmetic boundaries)
- tests/permission_tests.rs (unauthorized calls revert)
- tests/upgrade_tests.rs (state preservation)
- tests/event_tests.rs (every state change emits correct CEP-88 event)
- tests/integration.rs (cross-contract calls)

Every contract must:
- Compile via `cargo odra build`
- Pass `cargo test --workspace` (100%)
- Pass `cargo clippy -- -D warnings` (0 warnings)
- Pass `cargo fmt --check` (0 diffs)
- Have rustdoc on every public function
- Have NO TODOs, NO stubs, NO unimplemented!()

Output: PHASE_REPORT.md using template in Part 6.2. Include WASM file sizes, test counts, test pass rates.

STOP. Wait for my approval before starting Phase 3.
```

## Phase 3 Prompt — Contract Testing & Local Deployment

```
Read FINAL_PROMPT.md (Part 5 Phase 3, Part 7) and the Phase 2 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 3 (Contract Testing & Local Deployment).

Specifically:
1. Set up local nctl network via Docker (docker-compose.yml already exists from Phase 1).
2. Write tests/integration/deploy.rs that deploys all 5 contracts to nctl.
3. Write tests/integration/full_lifecycle.rs that executes: issue token → deposit CSPR → StakingVault delegates → era advances → rewards accrue → YieldDistributor distributes → CEP-88 events emitted. Use nctl-increase-era to fast-forward eras.
4. Write tests/integration/restake.rs that tests YieldAgent restake flow (mock the agent's signing key for unit test; real signing in Phase 6).
5. Write tests/integration/revoke.rs that tests ComplianceAgent revoke flow.
6. Write tests/integration/adversarial.rs that simulates attacker trying to drain StakingVault (must revert).
7. Write tests/gas-analysis/gas_report.rs that measures CSPR cost of every operation (deposit, delegate, distribute, revoke, upgrade).
8. Write tests/benchmarks/deposit_bench.rs and distribute_bench.rs (throughput tests).
9. Write tests/security/access_control.rs, replay_protection.rs, upgrade_safety.rs.

Run all tests against local nctl:
- cargo test --test '*' (all integration tests pass)
- cargo test --test gas_analysis -- --nocapture (gas report generated)
- cargo bench (benchmarks generated)

Output: docs/GAS_ANALYSIS.md, docs/BENCHMARKS.md, and PHASE_REPORT.md.

STOP. Wait for my approval before starting Phase 4.
```

## Phase 4 Prompt — Testnet Deployment

```
Read FINAL_PROMPT.md (Part 5 Phase 4, Part 11) and the Phase 3 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 4 (Testnet Deployment).

Specifically:
1. Write scripts/deploy-testnet.sh that deploys all 5 contracts to Casper Testnet (casper-test) using casper-client v5.0.1.
2. Write scripts/verify-testnet.sh that verifies each contract on https://testnet.cspr.live.
3. Write scripts/generate-abi.sh that generates TypeScript types from contract schemas. Output to packages/meridian-ts-types/.
4. Deploy all 5 contracts to testnet.
5. Verify all 5 contracts on CSPR.live.
6. Save all contract hashes, package hashes, deploy hashes, wasm hashes to deployed/addresses.json (committed to repo).
7. Generate TypeScript types and publish as private npm package @meridian/ts-types.
8. Write tests/integration/testnet_smoke.rs that runs against live testnet: issue a test token, deposit CSPR, verify stake appears, verify era rewards accrue.

Run:
- ./scripts/deploy-testnet.sh (all 5 contracts deployed)
- ./scripts/verify-testnet.sh (all 5 contracts verified)
- cargo test --test testnet_smoke (passes)

Output: deployed/addresses.json (committed), packages/meridian-ts-types/, and PHASE_REPORT.md (include all transaction hashes).

STOP. Wait for my approval before starting Phase 5.
```

## Phase 5 Prompt — Backend

```
Read FINAL_PROMPT.md (Part 5 Phase 5, Part 8) and the Phase 4 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 5 (Backend).

Specifically, implement the backend service per the file structure in Part 5 Phase 5 of FINAL_PROMPT.md, using the pinned dependencies from Part 8.2.

CRITICAL REQUIREMENTS (from Part 8):
- No mock APIs. Every endpoint returns real data from PostgreSQL or real-time chain queries.
- Real PostgreSQL 15+ with migrations (no SQLite for production paths).
- Real event listener subscribing to Sidecar SSE (/events/stream).
- Real blockchain synchronization (on startup, query last indexed block_height, sync forward).
- Retry logic with exponential backoff for every external call.
- Health checks (GET /health returns 200 only if ALL dependencies reachable).
- Prometheus metrics at GET /metrics (mandatory metrics listed in Part 8.1 #9).
- Structured JSON logging (pino). Never log private keys or API keys.

Implement:
- src/config/env.ts (loads + validates all 23 ENV vars via zod)
- src/db/ (postgres pool + 5 migrations + 4 repositories)
- src/casper/ (rpc_client, sidecar_client, transaction_builder using casper-js-sdk v5.0.12 TransactionV1Builder, signer)
- src/indexer/ (event_listener, era_detector, sync_service)
- src/api/ (routes for tokens, holders, yields, audit; auth; rate_limiter)
- src/metrics/prometheus.ts
- src/health/checks.ts
- src/utils/ (retry, logger)

Run:
- npm run migrate (all 5 migrations succeed)
- npm run dev (backend starts on port 3000)
- Verify GET /health returns 200
- Verify event listener is indexing (SELECT COUNT(*) FROM events > 0 after 5 min)
- Verify GET /tokens returns real data
- Verify GET /tokens/:id/yield returns real APY
- Verify retry logic (simulate Sidecar disconnection, verify reconnect)
- npm run test:unit (all unit tests pass)
- npm run test:integration (all integration tests pass)

Output: PHASE_REPORT.md (include Prometheus metrics output, sample event from DB).

STOP. Wait for my approval before starting Phase 6.
```

## Phase 6 Prompt — AI Agents

```
Read FINAL_PROMPT.md (Part 5 Phase 6, Part 10) and the Phase 5 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 6 (AI Agents).

Specifically, implement 3 TypeScript AI agents per the file structure in Part 5 Phase 6, using pinned dependencies from Part 10.2.

CRITICAL REQUIREMENTS (from Part 10):
- Every AI component uses real APIs (Claude, GPT-4o, Gemini). NO mock LLM responses.
- Every tool call works (real MCP tools, real Casper RPC, real backend APIs).
- Every MCP tool verified (must have passing integration test).
- Every prompt tested (version-controlled in agents/*/prompts/, test cases in agents/*/tests/prompt_tests/).
- No free-text user input to LLMs (agents only consume structured on-chain state). Prevents prompt injection.
- Adversarial verification (AuditAgent reviews every YieldAgent restake decision using a different LLM; disagreement blocks + Telegram alert).
- Model fallback (primary + fallback per agent; if both fail, agent enters degraded mode).
- Reproducibility (every decision recorded on-chain as CEP-88 event).
- Rate limiting (max 1 LLM call/sec, max 60/min per agent).
- Cost tracking (token count + estimated cost per call, emitted to Prometheus).

Implement:
- agents/shared/ (ai_client with Anthropic/OpenAI/Google implementations, casper_client, redis_pubsub, key_loader, health_check)
- agents/yield_agent/ (main, reasoning_loop, prompts, validator_curator) — runs every era, reads StakingVault state, decides restake via Claude Sonnet 4.5 (fallback GPT-4o), signs TransactionV1, submits to RPC, emits CEP-88 event
- agents/compliance_agent/ (main, screening_loop, prompts, sanctions_checker, attestation_tracker) — subscribes to Transfer events, screens recipient via GPT-4o (fallback Claude), if sanctions match → calls ComplianceRegistry.revoke(), emits CEP-88 event
- agents/audit_agent/ (main, audit_loop, adversarial_check, prompts) — every hour, pulls CEP-88 events, generates summary via Gemini 2.5 Flash (fallback Claude Haiku), signs, submits to MeridianAudit contract. ALSO reviews every YieldAgent restake decision before it commits.
- agents/operator_alerts/telegram_bot.ts

Run:
- npm run start:yield-agent (starts, connects to backend, ready for era events)
- npm run start:compliance-agent (starts, subscribes to Transfer events)
- npm run start:audit-agent (starts, generates first hourly summary)
- Verify adversarial verification (simulate bad YieldAgent decision, verify AuditAgent blocks it)
- Verify Telegram alert on adversarial disagreement
- npm run test:unit (all unit tests pass)
- npm run test:integration (all integration tests pass — including simulated era boundary for YieldAgent, simulated Transfer event for ComplianceAgent)

Output: PHASE_REPORT.md (include sample agent decisions, transaction hashes, adversarial check results).

STOP. Wait for my approval before starting Phase 7.
```

## Phase 7 Prompt — MCP Server + x402 Facilitator

```
Read FINAL_PROMPT.md (Part 5 Phase 7) and the Phase 6 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 7 (MCP Server + x402 Facilitator).

Specifically:

A. Implement Meridian MCP server (mcp-server/):
- 12 tools (6 Read + 6 Write) per Part 5 Phase 7
- Non-custodial (Write tools return unsigned TransactionV1; caller signs locally)
- Runs in stdio mode (for Claude Desktop) and HTTP mode (for remote agents)
- MCP protocol version 2024-11-05 (matches cspr-trade-mcp)
- ClawHub skill (clawhub-skill/SKILL.md) for npx clawhub@latest install meridian-mcp

B. Fork odradev/casper-x402-poc into x402-facilitator/:
- Customize facilitator to settle payments to Meridian treasury
- Use casper-eip-712 v1.2.0 with casper-native feature for EIP-712 signing
- Run via just docker-up

C. Implement 3 x402 loops (all settled on Casper Testnet):
- Loop 1 (inbound): external agent calls get_yield_rate → 402 → signs EIP-712 → settles → 200 with yield data
- Loop 2 (outbound): YieldAgent calls external validator-monitor → 402 → pays → receives perf data
- Loop 3 (operational): ComplianceAgent calls external sanctions API → 402 → pays → receives Merkle root

Run:
- npm run start:mcp-stdio (MCP server runs in stdio mode)
- npm run start:mcp-http (MCP server runs on port 3002)
- Test all 12 tools via MCP Inspector (https://github.com/modelcontextprotocol/inspector)
- Publish @meridian/mcp to npm (private initially)
- Publish ClawHub skill
- just docker-up (x402 facilitator runs)
- Test all 3 x402 loops against testnet (verify transaction hashes on testnet.cspr.live)

Output: PHASE_REPORT.md (include MCP tool list, ClawHub skill URL, x402 transaction hashes).

STOP. Wait for my approval before starting Phase 8.
```

## Phase 8 Prompt — Frontend

```
Read FINAL_PROMPT.md (Part 5 Phase 8, Part 9) and the Phase 7 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 8 (Frontend).

Specifically, implement Next.js 16 + Tailwind 4 + shadcn/ui dApp per the file structure in Part 5 Phase 8, using pinned dependencies from Part 9.2.

CRITICAL REQUIREMENTS (from Part 9):
- No mock UI. Every page renders real data from backend API or real-time chain queries.
- Every number comes from blockchain or backend. NO hardcoded balances, APYs, holder counts.
- Every wallet action executes real TransactionV1 via CSPR.click v1.9.0+.
- Every chart uses real indexed data from backend.
- Every button tested with Playwright e2e.
- No placeholder pages. No "Coming Soon" pages.
- No console.log in production.
- No `any` types in TypeScript (ESLint rule error).

Implement:
- app/layout.tsx (root layout with CSPR.click provider)
- app/page.tsx (landing — real protocol stats from backend)
- app/issue/page.tsx (issuer flow — issue token via CSPR.click signing)
- app/dashboard/page.tsx (holder dashboard — real balance, yield, compliance, audit trail)
- app/audit/page.tsx (audit trail — real CEP-88 events)
- app/api/ (proxy routes to backend — never expose API keys)
- components/ (WalletConnect, TokenIssueForm, StakingPanel, YieldChart, ComplianceBadge, AuditTrail, ui/)
- lib/ (csprclick.ts, api.ts, casper.ts, types.ts)

Use the integration patterns from Part 9.3 (CSPR.click) and Part 9.4 (real transaction submission).

Run:
- npm run dev (frontend starts on port 3001)
- Verify landing page loads with real protocol stats
- Verify wallet connect works (CSPR.click opens wallet selector)
- Verify issue page: fill form → click Issue → CSPR.click signs → tx submitted → poll until confirmed → token appears
- Verify dashboard: real balance, yield, compliance, audit
- Verify YieldChart renders real era-by-era data
- Lighthouse score ≥ 90 on all 4 metrics
- npm run test:unit (vitest — all pass)
- npm run test:e2e (playwright — all pass)

Output: PHASE_REPORT.md (include Lighthouse scores, playwright test results, screenshots).

STOP. Wait for my approval before starting Phase 9.
```

## Phase 9 Prompt — Integration

```
Read FINAL_PROMPT.md (Part 5 Phase 9) and the Phase 8 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 9 (Integration).

Specifically, implement end-to-end integration tests:

1. tests/e2e/full_lifecycle.spec.ts (playwright):
   - Browser opens frontend
   - Connects wallet via CSPR.click
   - Issues a test token
   - Deposits CSPR
   - Verifies stake appears
   - Waits for era boundary (or fast-forwards on nctl)
   - Verifies yield distribution
   - Verifies compliance revocation (simulate bad actor)
   - Verifies audit summary appears
   - All against real testnet

2. tests/e2e/multi_agent_scenario.spec.ts:
   - Simulated portfolio agent (TypeScript service) queries Meridian MCP server
   - MCP server returns 402 for get_yield_rate
   - Portfolio agent signs EIP-712 with its keypair
   - Pays 0.01 CSPR via x402
   - Receives yield data
   - Adds MeridianToken to simulated portfolio
   - All payments settled on testnet (verify transaction hashes)

3. tests/e2e/x402_query_flow.spec.ts:
   - 100 sequential x402 queries
   - All succeed
   - All payments settled on testnet

4. tests/performance/deposit_load.rs:
   - 100 concurrent deposits (10 wallets × 10 deposits each)
   - All succeed within 60 seconds

5. tests/performance/distribution_load.rs:
   - 10 era distributions (use nctl-increase-era)
   - All succeed within 10 minutes

6. tests/performance/x402_query_load.ts:
   - 1000 x402 queries
   - 95th percentile latency < 2 seconds

Run all tests. All must pass.

Output: PHASE_REPORT.md (include test results, performance numbers, transaction hashes).

STOP. Wait for my approval before starting Phase 10.
```

## Phase 10 Prompt — Production QA

```
Read FINAL_PROMPT.md (Part 5 Phase 10, Part 12) and the Phase 9 PHASE_REPORT.md (approved).

Your task: Execute ONLY Phase 10 (Production QA).

Specifically:

1. Security review:
   - Run cargo audit (0 vulnerabilities)
   - Run npm audit (0 vulnerabilities)
   - Manual security review using checklist in docs/SECURITY.md (write the checklist if not exists)
   - Document any findings + mitigations

2. Gas analysis (final, against testnet):
   - Re-run tests/gas-analysis/gas_report.rs against testnet
   - Update docs/GAS_ANALYSIS.md with testnet numbers
   - Verify every operation ≤ 5 CSPR per user-facing operation

3. Benchmarks (final):
   - Re-run cargo bench
   - Update docs/BENCHMARKS.md

4. Documentation:
   - docs/RUNBOOK.md (operator runbook — deploy + monitor + troubleshoot)
   - docs/API.md (every backend endpoint with request/response examples)
   - docs/ARCHITECTURE.md (system architecture with diagram)
   - docs/SECURITY.md (threat model + mitigations)
   - docs/DEMO_SCRIPT.md (90-second demo script)

5. Demo video:
   - Record 90-second video showing all 5 demo moments from Section 18 of strategy dossier
   - Upload to YouTube unlisted + IPFS
   - Save to demos/video/meridian-demo.mp4

6. Hackathon submission package:
   - GitHub repo public
   - README.md updated with Quick Start, Architecture, Demo sections
   - DoraHacks BUIDL updated with: GitHub link, demo video link, testnet contract hashes
   - deployed/addresses.json committed

Run ALL Part 12.1 checks:
- 100% build success
- 100% tests pass
- 0 warnings
- 0 mock data (grep returns 0 hits)
- 0 deprecated APIs
- 0 outdated SDKs
- All docs complete
- All contracts deployed + verified
- Smoke test passes

Output: PHASE_REPORT.md (final, includes all docs, demo video URL, hackathon submission links).

STOP. This is the final phase. Project is ready for hackathon submission.
```

---

# APPENDIX A — Critical Files Map

```
meridian/
├── FINAL_PROMPT.md                           ← This file (SINGLE SOURCE OF TRUTH)
├── ENVIRONMENT_REQUIREMENTS.md               ← 23 ENV vars documented
├── USER_ACTIONS.md                           ← 20 human-required actions
├── rust-toolchain.toml                       ← Rust 1.85+ stable + wasm32-unknown-unknown
├── justfile                                  ← All common commands
├── Cargo.toml                                ← Workspace with pinned deps
├── package.json                              ← npm workspaces with pinned deps
├── docker-compose.yml                        ← PostgreSQL + Redis + nctl
├── .env.example                              ← Template for .env
├── .github/workflows/ci.yml                  ← CI pipeline
├── scripts/
│   ├── bootstrap.sh                          ← Install all deps
│   ├── verify-env.sh                         ← 10-check ENV verification
│   ├── deploy-testnet.sh                     ← Deploy all contracts
│   ├── verify-testnet.sh                     ← Verify on CSPR.live
│   ├── generate-abi.sh                       ← Generate TS types
│   ├── fund-testnet.sh                       ← Fund deployer + agents
│   ├── smoke-test.sh                         ← Post-deployment smoke test
│   └── x402-smoke.sh                         ← x402 loop test
├── contracts/                                ← 5 Odra contracts (Phase 2)
├── agents/                                   ← 3 AI agents (Phase 6)
├── mcp-server/                               ← MCP server + ClawHub skill (Phase 7)
├── x402-facilitator/                         ← Forked x402 facilitator (Phase 7)
├── backend/                                  ← Node.js backend (Phase 5)
├── frontend/                                 ← Next.js dApp (Phase 8)
├── deployed/
│   └── addresses.json                        ← Testnet contract hashes (Phase 4)
├── packages/
│   └── meridian-ts-types/                    ← Auto-generated TS types (Phase 4)
├── docs/                                     ← All documentation (Phase 10)
├── tests/
│   ├── integration/                          ← Phase 3
│   ├── e2e/                                  ← Phase 9
│   ├── performance/                          ← Phase 9
│   ├── gas-analysis/                         ← Phase 3
│   ├── benchmarks/                           ← Phase 3
│   └── security/                             ← Phase 3
├── demos/
│   └── video/meridian-demo.mp4               ← Phase 10
└── PHASE_REPORT.md                           ← Regenerated after each phase
```

---

# APPENDIX B — Emergency Contacts + Escalation

If Cursor encounters any of the following, STOP IMMEDIATELY and escalate to human:

1. **Contract Access to Auction API surface has changed** — verify against casper-network/casper-node source; if different from Part 2 Finding B, halt and update FINAL_PROMPT.md
2. **Odra 2.8.1 fails to compile contracts** — check odra.dev/docs for breaking changes; pin to earlier version if needed
3. **casper-js-sdk v5.0.12 TransactionV1Builder API differs from Part 9.4** — check official SDK docs; update pattern
4. **CSPR.click v1.9.0 API differs from Part 9.3** — check docs.cspr.click; update pattern
5. **Testnet faucet rate limit prevents funding** — wait 24h, retry; if persists, ask in Casper Discord
6. **AI API rate limits prevent agent operation** — upgrade to paid tier or reduce agent frequency
7. **x402 facilitator fails to settle on testnet** — verify against odradev/casper-x402-poc README; check if Casper 2.0 compat issue
8. **Any contract audit finding rated Critical or High** — halt deployment; fix; re-audit

---

# APPENDIX C — Verification Date + Sources

This FINAL_PROMPT.md was verified against the following sources on 2026-06-28:

- Casper v2.2.1 release notes (https://github.com/casper-network/casper-node/releases/tag/v2.2.1)
- Casper Manifest (https://www.casper.network/news/manifest)
- Casper 2.0 Mainnet Launch (https://www.casper.network/news/casper-2-0-live-on-mainnet)
- Odra Framework v2.8.1 (https://github.com/odradev/odra)
- casper-js-sdk v5.0.12 (https://github.com/casper-ecosystem/casper-js-sdk)
- casper-client-rs v5.0.1 (https://github.com/casper-ecosystem/casper-client-rs)
- casper-eip-712 v1.2.0 (https://github.com/casper-ecosystem/casper-eip-712)
- CEP-18 v1.2.0 (https://github.com/casper-ecosystem/cep18)
- CEP-78 v1.5.1 (https://github.com/casper-ecosystem/cep-78-enhanced-nft)
- casper-x402-poc (https://github.com/odradev/casper-x402-poc)
- cspr-trade-mcp v0.6.0 (https://github.com/make-software/cspr-trade-mcp)
- casper-network-mcp v0.1.0 (https://github.com/Tairon-ai/casper-network-mcp)
- CSPR.click v1.9.0 (https://docs.cspr.click)
- CSPR.cloud (https://docs.cspr.cloud)
- Casper Sidecar v2.1.0 (https://github.com/casper-network/casper-sidecar)
- Casper delegate reference impl (https://github.com/casper-network/casper-node/blob/dev/smart_contracts/contracts/client/delegate/src/main.rs)
- Halborn Casper 2.0 Audit (https://www.halborn.com/audits/casper-association/casper-20-12a8fb)

Full research reports at:
- /home/z/my-project/research/casper-github-research.md (9,473 words)
- /home/z/my-project/research/casper-strategy-research.md (6,168 words)
- /home/z/my-project/research/top-competitors-deep-dive.md (5,115 words)
- /home/z/my-project/research/latest-versions-verification.md (5,816 words)
- /home/z/my-project/research/contract-access-to-auction-verification.md (3,520 words)

---

**END OF FINAL_PROMPT.md.**

**This is the SINGLE SOURCE OF TRUTH. Cursor must read this file in full before starting any phase. Cursor must NEVER execute more than ONE phase. Cursor must ALWAYS wait for human approval between phases.**

**Project status:** Ready for Phase 0 execution.
