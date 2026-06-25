export class BackendClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'x-api-key': this.apiKey },
    })
    if (!response.ok) {
      throw new Error(`backend_http_${response.status}`)
    }
    return response.json() as Promise<T>
  }

  async getTokens(): Promise<{ data: Array<Record<string, unknown>> }> {
    return this.get('/api/v1/tokens')
  }

  async getToken(packageHash: string): Promise<{ data: Record<string, unknown> }> {
    return this.get(`/api/v1/tokens/${encodeURIComponent(packageHash)}`)
  }

  async getYield(packageHash: string): Promise<{ data: Record<string, unknown> }> {
    return this.get(`/api/v1/tokens/${encodeURIComponent(packageHash)}/yield`)
  }

  async getCompliance(accountHash: string): Promise<{ data: Record<string, unknown> }> {
    return this.get(`/api/v1/holders/${encodeURIComponent(accountHash)}/compliance`)
  }

  async getEvents(limit = 20): Promise<{ data: Array<Record<string, unknown>> }> {
    return this.get(`/api/v1/events?limit=${limit}`)
  }

  async getAuditSummaries(limit = 10): Promise<{ data: Array<Record<string, unknown>> }> {
    return this.get(`/api/v1/audit/summaries?limit=${limit}`)
  }

  async getYieldHistory(limit = 20): Promise<{ data: Array<Record<string, unknown>> }> {
    return this.get(`/api/v1/yields/history?limit=${limit}`)
  }
}
