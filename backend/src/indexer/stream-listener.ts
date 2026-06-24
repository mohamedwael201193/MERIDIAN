import WebSocket from 'ws'
import type { Logger } from '../utils/logger.js'
import { sleep, withRetry } from '../utils/retry.js'

export interface ContractLevelEventMessage {
  action: string
  data: {
    contract_package_hash: string
    contract_hash?: string
    name: string
    data: Record<string, unknown>
    raw_data?: string
  }
  extra: {
    deploy_hash: string
    event_id: number
    transform_id?: number
    block_height: number
  }
  timestamp: string
}

export type EventHandler = (event: ContractLevelEventMessage) => Promise<void>

export interface StreamListenerOptions {
  streamingBaseUrl: string
  packageHashes: string[]
  apiKey: string
  log: Logger
  onEvent: EventHandler
  onReconnect?: () => void
}

export class ContractEventStreamListener {
  private ws: WebSocket | null = null
  private stopped = false
  private reconnectAttempt = 0

  constructor(private readonly options: StreamListenerOptions) {}

  start(): void {
    this.stopped = false
    void this.connect()
  }

  stop(): void {
    this.stopped = true
    this.ws?.close()
    this.ws = null
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  private buildUrl(): string {
    const hashes = this.options.packageHashes.join(',')
    const base = this.options.streamingBaseUrl.replace(/\/$/, '')
    return `${base}/contract-events?contract_package_hash=${hashes}&includes=raw_data`
  }

  private async connect(): Promise<void> {
    while (!this.stopped) {
      try {
        await this.openSocket()
        this.reconnectAttempt = 0
        return
      } catch (error) {
        this.reconnectAttempt += 1
        const delay = Math.min(30_000, 1000 * 2 ** Math.min(this.reconnectAttempt, 5))
        this.options.log.warn(
          { err: error, attempt: this.reconnectAttempt, delayMs: delay },
          'stream_reconnect',
        )
        this.options.onReconnect?.()
        await sleep(delay)
      }
    }
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.buildUrl()
      const ws = new WebSocket(url, {
        headers: { authorization: this.options.apiKey },
      })
      this.ws = ws

      ws.on('open', () => {
        this.options.log.info({ url: url.split('?')[0] }, 'stream_connected')
        resolve()
      })

      ws.on('message', (data) => {
        void this.handleMessage(data.toString())
      })

      ws.on('error', (error) => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(error)
        } else {
          this.options.log.error({ err: error }, 'stream_error')
        }
      })

      ws.on('close', () => {
        if (!this.stopped) {
          this.options.log.warn('stream_closed_reconnecting')
          void this.connect()
        }
      })
    })
  }

  private async handleMessage(raw: string): Promise<void> {
    try {
      const message = JSON.parse(raw) as ContractLevelEventMessage
      if (message.action === 'emitted') {
        await withRetry(() => this.options.onEvent(message), {
          attempts: 3,
          baseDelayMs: 250,
          maxDelayMs: 2000,
          label: 'process_stream_event',
        })
      }
    } catch (error) {
      this.options.log.error({ err: error }, 'stream_message_parse_error')
    }
  }
}
