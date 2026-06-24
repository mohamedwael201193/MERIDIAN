import type { CasperRpcClient } from '../casper/rpc-client.js'
import type { DeployedAddresses } from '../config/contracts.js'
import { packageHashesForStreaming } from '../config/contracts.js'
import type { CheckpointRepository } from '../db/repositories/checkpoint-repo.js'
import type { Logger } from '../utils/logger.js'
import type { EventProcessor } from './event-processor.js'
import { ContractEventStreamListener } from './stream-listener.js'

export interface SyncServiceOptions {
  addresses: DeployedAddresses
  processor: EventProcessor
  checkpoints: CheckpointRepository
  rpc: CasperRpcClient
  streamingBaseUrl: string
  apiKey: string
  log: Logger
  backfillOnStart: boolean
}

export class SyncService {
  private listener: ContractEventStreamListener | null = null
  private started = false

  constructor(private readonly options: SyncServiceOptions) {}

  async start(): Promise<void> {
    if (this.started) return
    this.started = true

    await this.options.processor.seedTokens()

    if (this.options.backfillOnStart) {
      const count = await this.options.processor.backfillFromKnownTransactions((hash) =>
        this.options.rpc.getTransaction(hash),
      )
      this.options.log.info({ backfilledEvents: count }, 'indexer_backfill_complete')
    }

    const packageHashes = packageHashesForStreaming(this.options.addresses.contracts)
    this.listener = new ContractEventStreamListener({
      streamingBaseUrl: this.options.streamingBaseUrl,
      packageHashes,
      apiKey: this.options.apiKey,
      log: this.options.log,
      onEvent: (event) => this.options.processor.processStreamEvent(event),
      onReconnect: () => {
        this.options.log.warn('indexer_stream_reconnect')
      },
    })
    this.listener.start()
    this.options.log.info({ contracts: packageHashes.length }, 'indexer_stream_started')
  }

  stop(): void {
    this.listener?.stop()
    this.started = false
  }

  isStreamConnected(): boolean {
    return this.listener?.isConnected() ?? false
  }

  async getLagBlocks(): Promise<number> {
    const status = await this.options.rpc.getStatus()
    const checkpoint = await this.options.checkpoints.get()
    return Math.max(0, status.lastBlockHeight - Number(checkpoint.last_block_height))
  }
}
