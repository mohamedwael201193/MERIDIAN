import { withRetry } from '../utils/retry.js'

export interface CsCloudBlock {
  block_height: number
  era_id: number
  timestamp: string
}

export class CsprCloudRestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private async get<T>(path: string): Promise<T> {
    return withRetry(
      async () => {
        const response = await fetch(`${this.baseUrl}${path}`, {
          headers: { Authorization: this.apiKey },
        })
        if (!response.ok) {
          throw new Error(`cspr_cloud_http_${response.status}`)
        }
        const body = (await response.json()) as { data: T }
        return body.data
      },
      { attempts: 5, baseDelayMs: 500, maxDelayMs: 8000, label: `cspr_rest_${path}` },
    )
  }

  async getBlock(height: number): Promise<CsCloudBlock> {
    return this.get<CsCloudBlock>(`/blocks/${height}`)
  }

  async ping(): Promise<boolean> {
    try {
      const status = await fetch(`${this.baseUrl.replace(/\/$/, '')}/blocks/1`, {
        headers: { Authorization: this.apiKey },
      })
      return status.status === 200 || status.status === 400
    } catch {
      return false
    }
  }
}
