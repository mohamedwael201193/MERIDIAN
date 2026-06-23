# PHASE 4 REPORT — Testnet Deployment

**Phase:** 4  
**Status:** Complete — all 5 contracts live on Casper testnet  
**Date:** 2026-06-28  
**Readiness score:** 95/100

---

## Deployment proof

| Field | Value |
| --- | --- |
| Network | `casper-test` |
| Deployer public key | `0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6` |
| Deployer account hash | `account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27` |
| Explorer (account) | [testnet.cspr.live/account/0203d64d…](https://testnet.cspr.live/account/0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6) |
| Registry file | `deployed/casper-test-contracts.toml` |
| Address export | `deployed/addresses.json` |

## Contract addresses

| Contract | Package hash | Explorer |
| --- | --- | --- |
| ComplianceRegistry | `contract-package-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8` | [View](https://testnet.cspr.live/contract/hash-e6ed2d2eb8a1ffc7aa55a4158643a3682493d6f15f1e7123113a9c8534ee84f8) |
| MeridianToken | `contract-package-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca` | [View](https://testnet.cspr.live/contract/hash-9bcac97d0e6723049fc130daa22f69e88a5d077a1df6b4e38536f0703bcaa2ca) |
| StakingVault | `contract-package-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7` | [View](https://testnet.cspr.live/contract/hash-3062ba32a4ef4d3fd0fc5c9d0895980b7bbbcc5f407590d1b14c60ca631300c7) |
| YieldDistributor | `contract-package-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34` | [View](https://testnet.cspr.live/contract/hash-378bf2fddb1e574f39014bff6280f101c264da6fc4c629ad4e8c0d8ce55a6c34) |
| MeridianAudit | `contract-package-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84` | [View](https://testnet.cspr.live/contract/hash-1d8bc0bbbb6dda232afcff2afa257e7572d1ac33c518b1852b9a34c707493d84) |

## Live transaction hashes

| Step | Tx hash | Explorer |
| --- | --- | --- |
| Deploy ComplianceRegistry | `930efed7e6e20e36b4f3a4d03bbe0a5952160f277c9c14387659da5a311b1bd8` | [tx](https://testnet.cspr.live/transaction/930efed7e6e20e36b4f3a4d03bbe0a5952160f277c9c14387659da5a311b1bd8) |
| Deploy MeridianToken | `ca4c4b96e6cf5638633b3123d5e54397b611256d656eea19938b5eb4493fcc74` | [tx](https://testnet.cspr.live/transaction/ca4c4b96e6cf5638633b3123d5e54397b611256d656eea19938b5eb4493fcc74) |
| Wire set_token_address | `3eafa92ddf56f60fda58fb43df57661ef7e1e99c5c1de702eb83cd422d04c054` | [tx](https://testnet.cspr.live/transaction/3eafa92ddf56f60fda58fb43df57661ef7e1e99c5c1de702eb83cd422d04c054) |
| Deploy StakingVault | `e69eb51cfe1fad92c581f953284266abb9fced6fb29e3d40e55de487338b0326` | [tx](https://testnet.cspr.live/transaction/e69eb51cfe1fad92c581f953284266abb9fced6fb29e3d40e55de487338b0326) |
| Deploy YieldDistributor | `2c3ca30dd90156bdd303837e16f152cfacf3fad531249f4e8030bab8deadc6e8` | [tx](https://testnet.cspr.live/transaction/2c3ca30dd90156bdd303837e16f152cfacf3fad531249f4e8030bab8deadc6e8) |
| Wire set_yield_distributor | `fe73226a365ce149ae17dc24556410e4b9d6a627467317999f932169ad8efca0` | [tx](https://testnet.cspr.live/transaction/fe73226a365ce149ae17dc24556410e4b9d6a627467317999f932169ad8efca0) |
| Wire set_staking_vault | `b41a4b8b81ce5741339134b467450c5848da970c0f3ccf1ca6a659d844f1c347` | [tx](https://testnet.cspr.live/transaction/b41a4b8b81ce5741339134b467450c5848da970c0f3ccf1ca6a659d844f1c347) |
| Wire register_holder (deployer) | `7c6a47662daf123203526b4f83433b4c9a19e4c7be045fbf473615d035a7ad15` | [tx](https://testnet.cspr.live/transaction/7c6a47662daf123203526b4f83433b4c9a19e4c7be045fbf473615d035a7ad15) |
| Deploy MeridianAudit | `1611925b3bf87df18855cac35dc42b9ecab695176cc49a6c4de8c9375034f08f` | [tx](https://testnet.cspr.live/transaction/1611925b3bf87df18855cac35dc42b9ecab695176cc49a6c4de8c9375034f08f) |

## Deploy command

```bash
# Requires: funded deployer, CSPR_CLOUD_AUTH_TOKEN, wasm-opt
./scripts/deploy-testnet.sh
```

## Wiring performed at deploy

- `ComplianceRegistry.set_token_address(MeridianToken)`
- `StakingVault.set_yield_distributor(YieldDistributor)`
- `MeridianToken.set_staking_vault(StakingVault)`
- `ComplianceRegistry.register_holder(deployer, attestation)`

## TypeScript bindings

- Package: `packages/meridian-ts-types/` (stub exports; full schema pending Odra schema JSON output)
- Regenerate: `./scripts/generate-abi.sh`

## Verification

```bash
./scripts/verify-testnet.sh
node scripts/export-addresses.mjs
```

## Failed attempts (resolved)

| Issue | Tx | Resolution |
| --- | --- | --- |
| Bulk memory WASM | `4abb6f5d…`, `ea237539…` | `wasm-opt` + rustflags |
| Deploy OOG @ 50 CSPR | `dd9d160a…` | `DEPLOY_GAS=450 CSPR` |

## Known risks

- Remaining CSPR balance reduced after deploy + integration tests — monitor before Phase 5 heavy testing
- TS schema JSON not emitted to `resources/` (stub types only)

## Readiness for Phase 5

`deployed/addresses.json` populated with all five contracts and deployment tx hashes. Backend may proceed after user approval.

**STOP:** Phase 5 (backend API) not started per authorization.
