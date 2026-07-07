import type { DeployedAddresses } from '../config/contracts.js'
import { contractNameByPackage, stripHashPrefix } from '../config/contracts.js'
import type { AuditRepository } from '../db/repositories/audit-repo.js'
import type { CheckpointRepository } from '../db/repositories/checkpoint-repo.js'
import type { DistributionRepository } from '../db/repositories/distribution-repo.js'
import type { EventRepository } from '../db/repositories/event-repo.js'
import type { HolderRepository } from '../db/repositories/holder-repo.js'
import type { TokenRepository } from '../db/repositories/token-repo.js'
import type { Logger } from '../utils/logger.js'
import type { ContractLevelEventMessage } from './stream-listener.js'
import { eraFromBlockHeight } from './era-detector.js'

function stringField(value: unknown, fallback = '0'): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
    return String(value)
  }
  return fallback
}

export class EventProcessor {
  private readonly nameByPackage: Map<string, string>

  constructor(
    private readonly addresses: DeployedAddresses,
    private readonly events: EventRepository,
    private readonly tokens: TokenRepository,
    private readonly holders: HolderRepository,
    private readonly distributions: DistributionRepository,
    private readonly checkpoints: CheckpointRepository,
    private readonly audit: AuditRepository,
    private readonly log: Logger,
  ) {
    this.nameByPackage = contractNameByPackage(addresses.contracts)
  }

  async seedTokens(): Promise<void> {
    for (const [name, entry] of Object.entries(this.addresses.contracts)) {
      await this.tokens.upsertFromDeployment(
        entry.package_hash,
        name,
        name === 'MeridianToken' ? 'MRWA' : undefined,
      )
    }
  }

  async processStreamEvent(message: ContractLevelEventMessage): Promise<void> {
    const pkg = message.data.contract_package_hash
    const contractName =
      this.nameByPackage.get(pkg) ?? this.nameByPackage.get(`contract-package-${pkg}`) ?? 'Unknown'
    const inserted = await this.events.insertEvent({
      contractName,
      contractPackageHash: pkg,
      contractHash: message.data.contract_hash,
      eventName: message.data.name,
      eventData: message.data.data,
      rawData: message.data.raw_data,
      blockHeight: message.extra.block_height,
      eventId: message.extra.event_id,
      transformId: message.extra.transform_id,
      transactionHash: message.extra.deploy_hash,
    })

    if (!inserted) {
      return
    }

    await this.checkpoints.update(message.extra.block_height, message.extra.event_id)
    await this.applyDomainUpdates(contractName, message)
    this.log.info(
      {
        event: message.data.name,
        contract: contractName,
        block: message.extra.block_height,
        tx: message.extra.deploy_hash,
      },
      'event_indexed',
    )
  }

  private async applyDomainUpdates(
    contractName: string,
    message: ContractLevelEventMessage,
  ): Promise<void> {
    const data = message.data.data
    const eventName = message.data.name

    if (contractName === 'ComplianceRegistry') {
      if (eventName === 'HolderRegistered' && typeof data.holder === 'string') {
        await this.holders.upsertRegistered(
          data.holder,
          typeof data.country === 'number' ? data.country : undefined,
        )
      }
      if (eventName === 'HolderRevoked' && typeof data.holder === 'string') {
        await this.holders.markRevoked(
          data.holder,
          typeof data.reason === 'string' ? data.reason : 'revoked',
        )
      }
    }

    if (contractName === 'StakingVault') {
      if (eventName === 'Staked' && typeof data.amount === 'string') {
        const token = this.addresses.contracts.MeridianToken
        if (token) {
          const current = await this.tokens.findByPackageHash(token.package_hash)
          const prev = BigInt(current?.total_staked ?? '0')
          const next = prev + BigInt(data.amount)
          await this.tokens.updateStaked(token.package_hash, next.toString())
        }
      }
      if (eventName === 'Undelegated' && typeof data.amount === 'string') {
        const token = this.addresses.contracts.MeridianToken
        if (token) {
          const current = await this.tokens.findByPackageHash(token.package_hash)
          const prev = BigInt(current?.total_staked ?? '0')
          const next = prev > BigInt(data.amount) ? prev - BigInt(data.amount) : 0n
          await this.tokens.updateStaked(token.package_hash, next.toString())
        }
      }
    }

    if (contractName === 'YieldDistributor' && eventName === 'YieldDistributed') {
      const eraId = eraFromBlockHeight(message.extra.block_height)
      await this.distributions.insert({
        eraId,
        blockHeight: message.extra.block_height,
        transactionHash: message.extra.deploy_hash,
        totalRewards: stringField(data.total_rewards ?? data.amount),
        protocolFee: stringField(data.protocol_fee),
      })
    }

    if (contractName === 'MeridianAudit' && eventName === 'AuditSummarySubmitted') {
      await this.audit.insert({
        periodStart: new Date(Date.now() - 3_600_000),
        periodEnd: new Date(),
        summary:
          typeof data.summary_payload === 'string' ? data.summary_payload : JSON.stringify(data),
        decisionHash: message.extra.deploy_hash,
        transactionHash: message.extra.deploy_hash,
        eventCount: 1,
      })
    }
  }

  async backfillFromKnownTransactions(
    fetchTx: (hash: string) => Promise<Record<string, unknown>>,
  ): Promise<number> {
    let indexed = 0
    for (const entry of this.addresses.transaction_hashes) {
      try {
        const tx = await fetchTx(entry.hash)
        const count = await this.indexLabeledTransaction(tx, entry.hash, entry.label)
        indexed += count
        await this.checkpoints.update(this.blockHeightFromTx(tx), 0, entry.hash)
      } catch (error) {
        this.log.warn({ err: error, tx: entry.hash, label: entry.label }, 'backfill_tx_skip')
      }
    }
    return indexed
  }

  private blockHeightFromTx(txResult: Record<string, unknown>): number {
    const execution = txResult.execution_info as Record<string, unknown> | undefined
    const height = execution?.block_height
    return typeof height === 'number' ? height : 0
  }

  private async indexLabeledTransaction(
    txResult: Record<string, unknown>,
    txHash: string,
    label: string,
  ): Promise<number> {
    const blockHeight = this.blockHeightFromTx(txResult) || 1
    let indexed = 0

    if (label === 'wire_register_holder') {
      const registry = this.addresses.contracts.ComplianceRegistry
      if (registry) {
        const inserted = await this.events.insertEvent({
          contractName: 'ComplianceRegistry',
          contractPackageHash: stripHashPrefix(registry.package_hash),
          eventName: 'HolderRegistered',
          eventData: {
            holder: 'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27',
            country: 840,
            source: 'backfill',
            transaction_label: label,
          },
          blockHeight,
          eventId: 0,
          transactionHash: txHash,
        })
        if (inserted) {
          await this.holders.upsertRegistered(
            'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27',
            840,
          )
          indexed += 1
        }
      }
    }

    if (label.startsWith('deploy_')) {
      const contractName = label.replace('deploy_', '')
      const contract = this.addresses.contracts[contractName]
      if (contract) {
        const inserted = await this.events.insertEvent({
          contractName,
          contractPackageHash: stripHashPrefix(contract.package_hash),
          eventName: 'ContractDeployed',
          eventData: { label, source: 'backfill' },
          blockHeight,
          eventId: 1,
          transactionHash: txHash,
        })
        if (inserted) indexed += 1
      }
    }

    indexed += await this.extractEventsFromTransaction(txResult, txHash)
    return indexed
  }

  async extractEventsFromTransaction(
    txResult: Record<string, unknown>,
    txHash: string,
  ): Promise<number> {
    const execution = txResult.execution_info as Record<string, unknown> | undefined
    const execResult = execution?.execution_result as Record<string, unknown> | undefined
    const success =
      (execResult?.Success as Record<string, unknown> | undefined) ??
      (execResult?.Version2 as Record<string, unknown> | undefined)
    const effects = (success?.effects ?? []) as Array<Record<string, unknown>>

    let count = 0
    const blockHeight = this.blockHeightFromTx(txResult) || 1

    for (const effect of effects) {
      const kind = effect.kind as Record<string, unknown> | undefined
      const transform = kind?.Transform as Record<string, unknown> | undefined
      if (!transform) continue

      const transformType = transform.transform as Record<string, unknown> | undefined
      const write = transformType?.Write as Record<string, unknown> | undefined
      const clValue = write?.CLValue as Record<string, unknown> | undefined
      if (!clValue) continue

      const parsed = clValue.parsed as Record<string, unknown> | undefined
      if (!parsed || parsed.event_type === undefined) continue

      const eventName =
        typeof parsed.event_type === 'string'
          ? parsed.event_type
          : typeof parsed.name === 'string'
            ? parsed.name
            : 'Unknown'
      const packageHash =
        typeof parsed.contract_package_hash === 'string' ? parsed.contract_package_hash : ''
      const contractPackage = stripHashPrefix(packageHash)
      if (!contractPackage) continue

      const contractName =
        this.nameByPackage.get(contractPackage) ??
        this.nameByPackage.get(`contract-package-${contractPackage}`) ??
        'Unknown'

      const inserted = await this.events.insertEvent({
        contractName,
        contractPackageHash: contractPackage,
        eventName,
        eventData: parsed,
        blockHeight: blockHeight || 1,
        eventId: count,
        transactionHash: txHash,
      })
      if (inserted) {
        count += 1
      }
    }

    return count
  }
}
