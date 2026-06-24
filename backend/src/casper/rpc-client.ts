import { withRetry } from '../utils/retry.js'

export interface RpcStatus {
  chainspecName: string
  lastBlockHeight: number
  lastEraId: number
}

export class CasperRpcClient {
  constructor(
    private readonly rpcUrl: string,
    private readonly apiKey?: string,
  ) {}

  private async call<T>(method: string, params: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) {
      headers.Authorization = this.apiKey
    }
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    })
    if (!response.ok) {
      throw new Error(`rpc_http_${response.status}`)
    }
    const body = (await response.json()) as { result?: T; error?: { message: string } }
    if (body.error) {
      throw new Error(`rpc_error:${body.error.message}`)
    }
    if (body.result === undefined) {
      throw new Error('rpc_missing_result')
    }
    return body.result
  }

  async getStatus(): Promise<RpcStatus> {
    return withRetry(
      async () => {
        const result = await this.call<{
          chainspec_name: string
          last_added_block_info: { height: number }
          last_progress: { era_id: number }
        }>('info_get_status', null)
        return {
          chainspecName: result.chainspec_name,
          lastBlockHeight: result.last_added_block_info.height,
          lastEraId: result.last_progress.era_id,
        }
      },
      { attempts: 5, baseDelayMs: 500, maxDelayMs: 5000, label: 'info_get_status' },
    )
  }

  async getTransaction(hash: string): Promise<Record<string, unknown>> {
    return withRetry(
      async () =>
        this.call('info_get_transaction', {
          transaction_hash: { Version1: hash },
        }),
      { attempts: 5, baseDelayMs: 500, maxDelayMs: 5000, label: 'info_get_transaction' },
    )
  }
}
