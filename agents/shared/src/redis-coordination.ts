import { Redis } from '@upstash/redis'

export class AgentCoordination {
  constructor(private readonly redis: Redis) {}

  private key(suffix: string): string {
    return `meridian:agents:${suffix}`
  }

  async publishDecision(channel: string, payload: unknown): Promise<void> {
    await this.redis.publish(this.key(channel), JSON.stringify(payload))
  }

  async setPendingReview(decisionHash: string, payload: unknown, ttlSeconds = 3600): Promise<void> {
    await this.redis.set(this.key(`pending:${decisionHash}`), JSON.stringify(payload), {
      ex: ttlSeconds,
    })
  }

  async getPendingReview(decisionHash: string): Promise<unknown | null> {
    const raw = await this.redis.get<string>(this.key(`pending:${decisionHash}`))
    if (!raw) return null
    return JSON.parse(raw) as unknown
  }

  async markReviewed(decisionHash: string, approved: boolean): Promise<void> {
    await this.redis.set(
      this.key(`reviewed:${decisionHash}`),
      JSON.stringify({ approved, at: new Date().toISOString() }),
      { ex: 86_400 },
    )
  }

  async isReviewApproved(decisionHash: string): Promise<boolean | null> {
    const raw = await this.redis.get<string>(this.key(`reviewed:${decisionHash}`))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { approved: boolean }
    return parsed.approved
  }

  async rateLimit(agent: string, maxPerMinute: number): Promise<boolean> {
    const bucket = this.key(`ratelimit:${agent}:${Math.floor(Date.now() / 60_000)}`)
    const count = await this.redis.incr(bucket)
    if (count === 1) {
      await this.redis.expire(bucket, 120)
    }
    return count <= maxPerMinute
  }
}
