export interface BackendClientOptions {
  baseUrl: string
  apiKey: string
}

export class BackendClient {
  constructor(private readonly options: BackendClientOptions) {}

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      headers: { 'x-api-key': this.options.apiKey },
    })
    if (!response.ok) {
      throw new Error(`backend_http_${response.status}`)
    }
    return response.json() as Promise<T>
  }

  async getTokens(): Promise<{ data: unknown[] }> {
    return this.get('/api/v1/tokens')
  }

  async getYield(packageHash: string): Promise<{ data: unknown }> {
    return this.get(`/api/v1/tokens/${encodeURIComponent(packageHash)}/yield`)
  }

  async getEvents(limit = 50): Promise<{ data: unknown[] }> {
    return this.get(`/api/v1/events?limit=${limit}`)
  }

  async getCompliance(accountHash: string): Promise<{ data: unknown }> {
    return this.get(`/api/v1/holders/${encodeURIComponent(accountHash)}/compliance`)
  }
}
