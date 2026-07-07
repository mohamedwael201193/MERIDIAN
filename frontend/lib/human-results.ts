export interface HumanSummary {
  headline: string
  lines: string[]
  detail?: unknown
}

export function formatYieldResult(data: unknown): HumanSummary {
  const y = data as Record<string, unknown>
  const apyBps = typeof y.estimatedApyBps === 'number' ? y.estimatedApyBps : 0
  const apy = (apyBps / 100).toFixed(2)
  const staked = typeof y.totalStaked === 'string' ? formatCSPR(y.totalStaked) : '—'
  const supply = typeof y.totalSupply === 'string' ? formatCSPR(y.totalSupply) : '—'
  const lastDist = y.lastDistribution as Record<string, unknown> | null | undefined
  const last =
    lastDist && typeof lastDist.distributed_at === 'string'
      ? new Date(lastDist.distributed_at).toLocaleDateString()
      : 'No distributions yet'

  return {
    headline: `Current yield is ${apy}% APY`,
    lines: [`${staked} CSPR staked of ${supply} total supply`, `Last distribution: ${last}`],
    detail: data,
  }
}

export function formatComplianceResult(data: unknown): HumanSummary {
  const c = data as Record<string, unknown>
  const ok = c.compliant === true
  const status = typeof c.status === 'string' ? c.status : 'unknown'
  return {
    headline: ok ? "You're cleared to invest" : 'Action may be required',
    lines: [
      `Status: ${status}`,
      ok
        ? 'You can transfer MRWA and stake on Casper testnet.'
        : 'Complete registration before transferring tokens.',
    ],
    detail: data,
  }
}

export function formatValidatorsResult(data: unknown): HumanSummary {
  const raw = data as { validators?: Array<{ public_key: string }> }
  const list = raw.validators ?? []
  const top = list.slice(0, 3)
  return {
    headline: `${String(list.length)} validators available`,
    lines: top.length
      ? top.map((v, i) => `Validator ${String(i + 1)}: ${truncate(v.public_key, 16)}`)
      : ['No validators returned from network'],
    detail: data,
  }
}

export function formatTokenInfoResult(data: unknown): HumanSummary {
  const raw = data as { indexed?: { symbol?: string; total_supply?: string } }
  const indexed = raw.indexed
  const symbol = indexed?.symbol ?? 'MRWA'
  const supply = indexed?.total_supply ? formatCSPR(indexed.total_supply) : '—'
  return {
    headline: `${symbol} on Casper testnet`,
    lines: [`Total supply: ${supply} tokens`, 'Fixed supply — no minting'],
    detail: data,
  }
}

export function formatPlannerStep(tool: string, result: unknown): HumanSummary {
  switch (tool) {
    case 'get_yield_rate':
      return formatYieldResult(result)
    case 'get_compliance_status':
      return formatComplianceResult(result)
    case 'list_validators':
      return formatValidatorsResult(result)
    case 'get_token_info':
      return formatTokenInfoResult(result)
    case 'subscribe_audit': {
      const err = (result as { error?: string }).error
      if (err === 'PAYMENT_REQUIRED') {
        return {
          headline: 'Premium audit requires payment',
          lines: [
            'This report needs a small CSPR payment to unlock.',
            'You can pay from the wallet menu when ready.',
          ],
          detail: result,
        }
      }
      const summaries = (result as { summaries?: unknown[] }).summaries
      return {
        headline: 'Audit report ready',
        lines: [`${String(summaries?.length ?? 0)} summaries loaded`],
        detail: result,
      }
    }
    default:
      return {
        headline: 'Got it',
        lines: ['Your request completed successfully.'],
        detail: result,
      }
  }
}

function formatCSPR(motesOrAmount: string): string {
  try {
    const n = BigInt(motesOrAmount)
    if (n > 1_000_000_000n)
      return (Number(n) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 1 })
    return motesOrAmount
  } catch {
    return motesOrAmount
  }
}

function truncate(s: string, len: number): string {
  if (s.length <= len) return s
  return `${s.slice(0, len)}…`
}
