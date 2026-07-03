import WebSocket from 'ws'
import type { Logger } from '../utils/logger.js'
import { withRetry } from '../utils/retry.js'

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
  private connecting = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly options: StreamListenerOptions) {}

  start(): void {
    this.stopped = false
    void this.ensureConnected()
  }

  stop(): void {
    this.stopped = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
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

  private scheduleReconnect(reason: string): void {
    if (this.stopped || this.reconnectTimer) return
    this.reconnectAttempt += 1
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(this.reconnectAttempt, 5))
    this.options.log.warn(
      { attempt: this.reconnectAttempt, delayMs: delay, reason },
      'stream_reconnect',
    )
    this.options.onReconnect?.()
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.ensureConnected()
    }, delay)
  }

  private async ensureConnected(): Promise<void> {
    if (this.stopped || this.connecting || this.ws?.readyState === WebSocket.OPEN) return
    this.connecting = true
    try {
      await this.openSocket()
      this.reconnectAttempt = 0
    } catch (error) {
      this.options.log.warn({ err: error }, 'stream_connect_failed')
      this.scheduleReconnect('connect_failed')
    } finally {
      this.connecting = false
    }
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.buildUrl()
      const ws = new WebSocket(url, {
        headers: { authorization: this.options.apiKey },
      })
      this.ws = ws
      let settled = false
      let opened = false

      const finish = (error?: Error) => {
        if (settled) return
        settled = true
        if (error) reject(error)
        else resolve()
      }

      ws.on('open', () => {
        opened = true
        this.options.log.info({ url: url.split('?')[0] }, 'stream_connected')
        finish()
      })

      ws.on('message', (data: WebSocket.RawData) => {
        const raw = Buffer.isBuffer(data)
          ? data.toString('utf8')
          : typeof data === 'string'
            ? data
            : Buffer.from(data as ArrayBuffer).toString('utf8')
        void this.handleMessage(raw)
      })

      ws.on('error', (error) => {
        if (ws.readyState !== WebSocket.OPEN) {
          finish(error instanceof Error ? error : new Error(String(error)))
        } else {
          this.options.log.error({ err: error }, 'stream_error')
        }
      })

      ws.on('close', () => {
        this.ws = null
        if (!this.stopped && opened) {
          this.options.log.warn('stream_closed_reconnecting')
          this.scheduleReconnect('stream_closed')
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
