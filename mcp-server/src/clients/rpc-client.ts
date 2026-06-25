export interface ValidatorInfo {
  public_key: string
  stake: string
}

export class RpcClient {
  constructor(
    private readonly rpcUrl: string,
    private readonly apiKey?: string,
  ) {}

  private async call<T>(method: string, params: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) headers.Authorization = this.apiKey
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
    })
    if (!response.ok) throw new Error(`rpc_http_${response.status}`)
    const body = (await response.json()) as { result?: T; error?: { message: string } }
    if (body.error) throw new Error(`rpc_error:${body.error.message}`)
    if (body.result === undefined) throw new Error('rpc_missing_result')
    return body.result
  }

  async getAuctionValidators(limit = 10): Promise<ValidatorInfo[]> {
    const result = await this.call<{
      auction_state: {
        era_validators: Array<{
          validator_weights: Array<{ public_key: string; weight: string }>
        }>
      }
    }>('state_get_auction_info_v2', [])
    const weights = result.auction_state.era_validators[0]?.validator_weights ?? []
    return weights.slice(0, limit).map((v) => ({
      public_key: v.public_key,
      stake: v.weight,
    }))
  }

  async getStatus(): Promise<{ height: number; era: number }> {
    const result = await this.call<{
      last_added_block_info: { height: number }
      last_progress: { era_id: number }
    }>('info_get_status', null)
    return {
      height: result.last_added_block_info.height,
      era: result.last_progress.era_id,
    }
  }
}
