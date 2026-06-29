import type { DistributionRepository } from '../db/repositories/distribution-repo.js'
import type { EventRepository } from '../db/repositories/event-repo.js'
import type { HolderRepository } from '../db/repositories/holder-repo.js'
import type { TokenRepository } from '../db/repositories/token-repo.js'
import { eraFromBlockHeight } from '../indexer/era-detector.js'

export class TokenService {
  constructor(private readonly tokens: TokenRepository) {}

  async listTokens() {
    return this.tokens.list()
  }

  async getToken(packageHash: string) {
    return this.tokens.findByPackageHash(packageHash)
  }
}

export class HolderService {
  constructor(private readonly holders: HolderRepository) {}

  async getCompliance(accountHash: string) {
    const holder = await this.holders.findByAccount(accountHash)
    if (!holder) {
      return {
        accountHash,
        status: 'unknown' as const,
        compliant: false,
      }
    }
    return {
      accountHash: holder.account_hash,
      status: holder.status,
      compliant: holder.status === 'registered' && holder.sanctions_cleared,
      country: holder.country,
      accredited: holder.accredited,
      registeredAt: holder.registered_at,
      revokedAt: holder.revoked_at,
      revokeReason: holder.revoke_reason,
    }
  }

  async listHolders(limit: number) {
    return this.holders.list(limit)
  }
}

export class YieldService {
  constructor(
    private readonly tokens: TokenRepository,
    private readonly distributions: DistributionRepository,
    private readonly events: EventRepository,
  ) {}

  async getCurrentYield(packageHash: string) {
    const token = await this.tokens.findByPackageHash(packageHash)
    if (!token) {
      return null
    }
    const recent = await this.distributions.listByEra(10)
    const totalStaked = BigInt(token.total_staked)
    const totalRewards = recent.reduce((sum, row) => sum + BigInt(row.total_rewards), 0n)
    const apyBps =
      totalStaked > 0n && recent.length > 0
        ? Number((totalRewards * 10_000n) / totalStaked)
        : 0
    return {
      packageHash: token.package_hash,
      contractName: token.contract_name,
      totalStaked: token.total_staked,
      totalSupply: token.total_supply,
      recentEras: recent.length,
      estimatedApyBps: apyBps,
      lastDistribution: recent[0] ?? null,
    }
  }

  async getHistory(limit: number) {
    const distributions = await this.distributions.listByEra(limit)
    return distributions.map((row) => ({
      eraId: Number(row.era_id),
      blockHeight: Number(row.block_height),
      totalRewards: row.total_rewards,
      protocolFee: row.protocol_fee,
      transactionHash: row.transaction_hash,
      distributedAt: row.distributed_at,
    }))
  }

  async getDepositEvents(limit: number) {
    const deposits = await this.events.listByName('Deposited', limit)
    return deposits.map((event) => ({
      blockHeight: Number(event.block_height),
      transactionHash: event.transaction_hash,
      data: event.event_data,
      eraId: eraFromBlockHeight(Number(event.block_height)),
    }))
  }
}
