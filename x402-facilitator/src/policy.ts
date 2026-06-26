import { Redis } from '@upstash/redis'

export class ReplayGuard {
  constructor(private readonly redis: Redis) {}

  private key(nonce: string): string {
    return `meridian:x402:nonce:${nonce}`
  }

  async isUsed(nonce: string): Promise<boolean> {
    const value = await this.redis.get<string>(this.key(nonce))
    return value !== null
  }

  async markUsed(nonce: string, ttlSeconds = 86400): Promise<void> {
    await this.redis.set(this.key(nonce), '1', { ex: ttlSeconds, nx: true })
  }
}

export class PolicyEngine {
  constructor(
    private readonly maxAmountMotes: bigint,
    private readonly allowedPayTo: Set<string>,
  ) {}

  validate(amountMotes: bigint, payTo: string): void {
    if (amountMotes <= 0n) throw new Error('policy:amount_must_be_positive')
    if (amountMotes > this.maxAmountMotes) throw new Error('policy:amount_exceeds_max')
    if (!this.allowedPayTo.has(payTo)) throw new Error('policy:invalid_pay_to')
  }
}
