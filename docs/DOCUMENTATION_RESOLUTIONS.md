# Documentation Contradictions — Resolved for Phase 2–4

**Date:** 2026-06-28  
**Authority order:** User Phase 1 approval → `PROJECT_EXECUTION_PLAN.md` → `CASPER_EXECUTION_MASTER_GUIDE.md` → other bibles.

| Topic | Conflict | **Resolution (implemented)** |
| --- | --- | --- |
| Odra version | 2.8.1 vs 2.8.2 | **2.8.2** (crates.io verified; EXECUTION_MASTER + Phase 1 plan) |
| Phase 3 network | FINAL_PROMPT says nctl; EXECUTION_PLAN says testnet | **Casper testnet only** (user instruction + EXECUTION_PLAN Phase 3) |
| Phase 4 network | — | **Casper testnet** with funded deployer |
| StakingVault → auction | `call_subcall` vs `call_contract` vs manual runtime | **`ContractEnv::delegate/undelegate/redelegate`** per [Odra 2.8 delegating CSPR](https://odra.dev/docs/advanced/delegating-cspr) — official Odra abstraction over Contract Access to Auction |
| Auction hash | hardcoded vs dynamic | **`env().delegate(validator, amount)`** — Odra handles system auction internally |
| MCP protocol version | 2024-11-05 vs 2025-11-25 | **Deferred to Phase 7**; pin at phase start |
| CSPR.click SDK | 1.9.0 vs 1.13.0 | **Deferred to frontend phase** |
| ZenMux primary model | glm-5.2-free catalog | Primary slug kept; **Cerebras/Groq fallback chain** active (Phase 1) |

No implementation proceeds on unresolved items marked HIGH RISK without this file recording the chosen path.
