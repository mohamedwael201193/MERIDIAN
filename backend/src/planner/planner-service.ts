import { z } from 'zod'
import type { DeployedAddresses } from '../config/contracts.js'
import type { CasperRpcClient } from '../casper/rpc-client.js'
import type { AgentTraceRepository } from '../db/repositories/agent-trace-repo.js'
import type { HolderService, TokenService, YieldService } from '../services/index.js'
import type { AuditRepository } from '../db/repositories/audit-repo.js'
import type { EventRepository } from '../db/repositories/event-repo.js'
import { publishTrace } from '../services/trace-broadcaster.js'
import { PLANNER_TOOL_CATALOG, READ_TOOL_NAMES, WRITE_TOOL_NAMES } from './tool-catalog.js'

const MIN_DELEGATION_MOTES = 500_000_000_000n

function argString(args: Record<string, unknown>, key: string, fallback = ''): string {
  const value = args[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const planSchema = z.object({
  reasoning: z.string(),
  steps: z.array(
    z.object({
      tool: z.string(),
      kind: z.enum(['read', 'write']),
      args: z.record(z.unknown()).default({}),
      rationale: z.string(),
    }),
  ),
})

export interface PlannerExecuteInput {
  objective: string
  callerPublicKey?: string
  callerAccountHash?: string
  sessionId?: string
}

export interface PlannerExecuteResult {
  sessionId: string
  reasoning: string
  steps: Array<{
    tool: string
    kind: 'read' | 'write'
    rationale: string
    result?: unknown
    unsignedTransaction?: unknown
    walletRequired: boolean
  }>
}

export class PlannerService {
  constructor(
    private readonly traces: AgentTraceRepository,
    private readonly tokens: TokenService,
    private readonly holders: HolderService,
    private readonly yields: YieldService,
    private readonly events: EventRepository,
    private readonly audit: AuditRepository,
    private readonly rpc: CasperRpcClient,
    private readonly addresses: DeployedAddresses,
    private readonly invokeWriteTool: (
      tool: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>,
  ) {}

  async execute(input: PlannerExecuteInput): Promise<PlannerExecuteResult> {
    const sessionId = input.sessionId ?? crypto.randomUUID()

    await this.trace(sessionId, 'objective_received', `Objective: ${input.objective}`, {
      objective: input.objective,
      callerPublicKey: input.callerPublicKey,
    })

    await this.trace(sessionId, 'tool_discovery', 'Inspecting MERIDIAN MCP tool catalog', {
      tools: PLANNER_TOOL_CATALOG.map((t) => ({
        name: t.name,
        kind: t.kind,
        requiredRole: t.requiredRole,
      })),
    })

    const plan = this.buildPlan(input.objective, input.callerPublicKey, input.callerAccountHash)

    await this.trace(sessionId, 'reasoning', plan.reasoning, { steps: plan.steps.length })

    const executed: PlannerExecuteResult['steps'] = []

    for (const step of plan.steps) {
      await this.trace(sessionId, 'tool_selected', `${step.tool}: ${step.rationale}`, {
        tool: step.tool,
        kind: step.kind,
        args: step.args,
      })

      if (step.kind === 'write') {
        await this.trace(
          sessionId,
          'wallet_required',
          `Wallet signature required for ${step.tool}`,
          {
            tool: step.tool,
            requiredRole:
              PLANNER_TOOL_CATALOG.find((t) => t.name === step.tool)?.requiredRole ?? null,
          },
        )
      }

      try {
        const result = await this.invokeTool(step.tool, step.kind, step.args)
        await this.trace(sessionId, 'tool_invoked', `${step.tool} completed`, {
          tool: step.tool,
          preview:
            typeof result === 'object' && result !== null
              ? JSON.stringify(result).slice(0, 500)
              : String(result).slice(0, 500),
        })

        executed.push({
          tool: step.tool,
          kind: step.kind,
          rationale: step.rationale,
          result: step.kind === 'read' ? result : undefined,
          unsignedTransaction: step.kind === 'write' ? result : undefined,
          walletRequired: step.kind === 'write',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'tool_failed'
        await this.trace(sessionId, 'error', `${step.tool} failed: ${message}`, { tool: step.tool })
        throw error
      }
    }

    await this.trace(sessionId, 'complete', 'Planner execution finished', {
      stepCount: executed.length,
    })

    return { sessionId, reasoning: plan.reasoning, steps: executed }
  }

  private buildPlan(objective: string, callerPublicKey?: string, callerAccountHash?: string) {
    const lower = objective.toLowerCase()

    if (/\b(apy|yield|rate)\b/.test(lower) && /\b(history|distribution)\b/.test(lower)) {
      return {
        reasoning:
          'Yield report requires current metrics and distribution history — both are read-only.',
        steps: [
          {
            tool: 'get_yield_rate',
            kind: 'read' as const,
            args: {},
            rationale: 'Current APY and staking totals',
          },
          {
            tool: 'get_holder_yield',
            kind: 'read' as const,
            args: { limit: 10 },
            rationale: 'Recent distribution history',
          },
        ],
      }
    }

    if (
      /\b(portfolio|snapshot|exposure|kpi)\b/.test(lower) &&
      !/\b(delegate|stake|transfer|register)\b/.test(lower)
    ) {
      return {
        reasoning:
          'Portfolio review aggregates read tools: token info, yield metrics, and validator landscape.',
        steps: [
          {
            tool: 'get_token_info',
            kind: 'read' as const,
            args: {},
            rationale: 'MRWA metadata and contract addresses',
          },
          {
            tool: 'get_yield_rate',
            kind: 'read' as const,
            args: {},
            rationale: 'Current yield and staking ratio',
          },
          {
            tool: 'list_validators',
            kind: 'read' as const,
            args: { limit: 5 },
            rationale: 'Validator landscape for staking context',
          },
        ],
      }
    }

    if (/\b(audit|subscribe)\b/.test(lower) && /\b(premium|x402|payment|subscribe)\b/.test(lower)) {
      return {
        reasoning:
          'Premium audit requires subscribe_audit. Without x402 payment header, tool returns PAYMENT_REQUIRED — user must pay then retry.',
        steps: [
          {
            tool: 'subscribe_audit',
            kind: 'read' as const,
            args: { limit: 10 },
            rationale: 'Attempt premium audit feed (surfaces x402 gate)',
          },
        ],
      }
    }

    if (/\b(audit|summaries)\b/.test(lower)) {
      return {
        reasoning: 'Audit summaries are available from indexed backend via subscribe_audit flow.',
        steps: [
          {
            tool: 'subscribe_audit',
            kind: 'read' as const,
            args: { limit: 10 },
            rationale: 'Fetch audit summaries (x402 if gated)',
          },
        ],
      }
    }

    if (/\b(deposit.*vault|vault deposit)\b/.test(lower) && callerPublicKey) {
      const amountMatch = objective.match(/(\d+)\s*cspr/i)
      const motes = amountMatch?.[1]
        ? String(BigInt(amountMatch[1]) * 1_000_000_000n)
        : String(10_000_000_000n)
      return {
        reasoning:
          'Vault deposit is a write action. Read yield context first, then build deposit_to_vault.',
        steps: [
          {
            tool: 'get_yield_rate',
            kind: 'read' as const,
            args: {},
            rationale: 'Yield context before vault deposit',
          },
          {
            tool: 'deposit_to_vault',
            kind: 'write' as const,
            args: { callerPublicKey, amount: motes },
            rationale: 'Build unsigned vault deposit transaction',
          },
        ],
      }
    }

    if (/\brestake\b/.test(lower) && callerPublicKey) {
      return {
        reasoning: 'Restake requires curator role. Build unsigned restake between validators.',
        steps: [
          {
            tool: 'list_validators',
            kind: 'read' as const,
            args: { limit: 5 },
            rationale: 'Discover validators for restake',
          },
          {
            tool: 'restake',
            kind: 'write' as const,
            args: {
              callerPublicKey,
              fromValidator: 'select-from-list_validators-result',
              toValidator: 'select-second-validator',
              amount: String(MIN_DELEGATION_MOTES),
            },
            rationale: 'Build unsigned restake transaction',
          },
        ],
      }
    }

    if (/\b(distribute.*reward|rewards)\b/.test(lower) && callerPublicKey) {
      return {
        reasoning: 'Reward distribution is a curator write action after reading yield history.',
        steps: [
          {
            tool: 'get_holder_yield',
            kind: 'read' as const,
            args: { limit: 5 },
            rationale: 'Recent eras for distribution context',
          },
          {
            tool: 'distribute_rewards',
            kind: 'write' as const,
            args: { callerPublicKey, eraId: '0' },
            rationale: 'Build unsigned distribute_rewards transaction',
          },
        ],
      }
    }

    if (/\b(compliance audit|holder status|my wallet)\b/.test(lower)) {
      const accountHash = callerAccountHash ?? 'account-hash-required'
      return {
        reasoning:
          'Compliance audit reads indexed registry status for the connected wallet account hash.',
        steps: [
          {
            tool: 'get_compliance_status',
            kind: 'read' as const,
            args: { accountHash },
            rationale: 'Read compliance registry for connected wallet',
          },
        ],
      }
    }

    if (
      /\b(apy|yield|rate)\b/.test(lower) &&
      !/\b(delegate|stake|transfer|register|revoke)\b/.test(lower)
    ) {
      return {
        reasoning:
          'The objective asks about yield or APY. I will call get_yield_rate first because it is a read tool and does not require wallet signing.',
        steps: [
          {
            tool: 'get_yield_rate',
            kind: 'read' as const,
            args: {},
            rationale: 'Fetch current MRWA yield metrics',
          },
        ],
      }
    }

    if (/\b(validators?|auction)\b/.test(lower) && !/\b(delegate|stake)\b/.test(lower)) {
      return {
        reasoning:
          'The objective asks about validators. list_validators is the appropriate read tool from live Casper RPC.',
        steps: [
          {
            tool: 'list_validators',
            kind: 'read' as const,
            args: { limit: 10 },
            rationale: 'List active validators',
          },
        ],
      }
    }

    if (/\b(compliance|registered|holder status)\b/.test(lower)) {
      const hashMatch =
        objective.match(/account-hash-[0-9a-f]+/i) ?? objective.match(/[0-9a-f]{64}/i)
      const accountHash = hashMatch?.[0] ?? ''
      return {
        reasoning:
          'Compliance questions should start with get_compliance_status before any write action.',
        steps: [
          {
            tool: 'get_compliance_status',
            kind: 'read' as const,
            args: { accountHash: accountHash || 'account-hash-required' },
            rationale: 'Read indexed compliance registry status',
          },
        ],
      }
    }

    if (/\b(register)\b/.test(lower) && callerPublicKey) {
      const hashMatch = objective.match(/account-hash-[0-9a-f]+/i)
      return {
        reasoning:
          'Registration is a write action. I read compliance status first, then build register_holder unsigned transaction for wallet signing.',
        steps: [
          ...(hashMatch
            ? [
                {
                  tool: 'get_compliance_status',
                  kind: 'read' as const,
                  args: { accountHash: hashMatch[0] },
                  rationale: 'Confirm holder is not already registered',
                },
              ]
            : []),
          {
            tool: 'register_holder',
            kind: 'write' as const,
            args: {
              callerPublicKey,
              holderAccountHash: hashMatch?.[0] ?? 'account-hash-required',
              attestationBytes: '00',
            },
            rationale: 'Build unsigned compliance registration transaction',
          },
        ],
      }
    }

    if (/\b(delegate|stake|staking)\b/.test(lower) && callerPublicKey) {
      const amountMatch = objective.match(/(\d+)\s*cspr/i)
      const amountMotes = amountMatch?.[1]
        ? String(BigInt(amountMatch[1]) * 1_000_000_000n)
        : String(MIN_DELEGATION_MOTES)

      if (BigInt(amountMotes) < MIN_DELEGATION_MOTES) {
        throw new Error(
          `Delegation amount must be at least 500 CSPR (${String(MIN_DELEGATION_MOTES)} motes). Requested: ${amountMotes} motes.`,
        )
      }

      return {
        reasoning:
          'Staking requires validator discovery first, then delegate_stake with minimum 500 CSPR enforced before wallet popup.',
        steps: [
          {
            tool: 'list_validators',
            kind: 'read' as const,
            args: { limit: 5 },
            rationale: 'Discover validators before delegation',
          },
          {
            tool: 'delegate_stake',
            kind: 'write' as const,
            args: {
              callerPublicKey,
              validator: 'select-from-list_validators-result',
              amount: amountMotes,
            },
            rationale: 'Build native Casper delegation transaction',
          },
        ],
      }
    }

    if (/\b(transfer|send)\b/.test(lower) && callerPublicKey) {
      return {
        reasoning:
          'Token transfer is a write action requiring wallet signature via transfer_token.',
        steps: [
          {
            tool: 'transfer_token',
            kind: 'write' as const,
            args: {
              callerPublicKey,
              recipientAccountHash: 'account-hash-required',
              amount: '1000',
            },
            rationale: 'Build unsigned MRWA transfer',
          },
        ],
      }
    }

    if (/\b(token info|mrwa|metadata)\b/.test(lower)) {
      return {
        reasoning: 'Token metadata is available via get_token_info read tool.',
        steps: [
          {
            tool: 'get_token_info',
            kind: 'read' as const,
            args: {},
            rationale: 'Fetch MRWA token info',
          },
        ],
      }
    }

    return {
      reasoning:
        'Objective mapped to a safe default: read token info and yield rate before suggesting any write action.',
      steps: [
        {
          tool: 'get_token_info',
          kind: 'read' as const,
          args: {},
          rationale: 'Baseline protocol context',
        },
        {
          tool: 'get_yield_rate',
          kind: 'read' as const,
          args: {},
          rationale: 'Current yield context',
        },
      ],
    }
  }

  private async invokeTool(
    tool: string,
    kind: 'read' | 'write',
    args: Record<string, unknown>,
  ): Promise<unknown> {
    if (kind === 'write') {
      if (tool === 'delegate_stake') {
        const amount = argString(args, 'amount', '0')
        if (BigInt(amount) < MIN_DELEGATION_MOTES) {
          throw new Error(
            `Minimum delegation is 500 CSPR (${String(MIN_DELEGATION_MOTES)} motes). Got ${amount} motes.`,
          )
        }
        if (args.validator === 'select-from-list_validators-result') {
          const validators = await this.invokeReadTool('list_validators', { limit: 5 })
          const list =
            (validators as { validators?: Array<{ public_key: string }> }).validators ?? []
          if (!list[0]?.public_key) throw new Error('no_validators_available')
          args = { ...args, validator: list[0].public_key }
        }
      }
      if (tool === 'restake') {
        if (
          args.fromValidator === 'select-from-list_validators-result' ||
          args.toValidator === 'select-second-validator'
        ) {
          const validators = await this.invokeReadTool('list_validators', { limit: 5 })
          const list =
            (validators as { validators?: Array<{ public_key: string }> }).validators ?? []
          if (!list[0]?.public_key) throw new Error('no_validators_available')
          args = {
            ...args,
            fromValidator: list[0].public_key,
            toValidator: list[1]?.public_key ?? list[0].public_key,
          }
        }
      }
      return this.invokeWriteTool(tool, args)
    }

    if (!(READ_TOOL_NAMES as readonly string[]).includes(tool)) {
      throw new Error(`unknown_read_tool:${tool}`)
    }
    return this.invokeReadTool(tool, args)
  }

  private async invokeReadTool(tool: string, args: Record<string, unknown>): Promise<unknown> {
    const tokenHash = this.addresses.contracts.MeridianToken?.package_hash ?? ''

    switch (tool) {
      case 'get_token_info': {
        const token = await this.tokens.getToken(argString(args, 'packageHash', tokenHash))
        return { deployed: this.addresses.contracts, indexed: token }
      }
      case 'get_yield_rate': {
        const yieldInfo = await this.yields.getCurrentYield(
          argString(args, 'packageHash', tokenHash),
        )
        return yieldInfo
      }
      case 'get_holder_yield': {
        const limit = Number(args.limit ?? 20)
        return this.yields.getHistory(Math.min(limit, 200))
      }
      case 'get_compliance_status': {
        return this.holders.getCompliance(argString(args, 'accountHash'))
      }
      case 'list_validators': {
        const validators = await this.rpc.getAuctionValidators(Number(args.limit ?? 10))
        return { validators, network: this.addresses.network }
      }
      case 'subscribe_audit': {
        if (!args.paymentHeader) {
          return {
            error: 'PAYMENT_REQUIRED',
            status: 402,
            resource: '/api/audit/subscribe',
            hint: 'Supply x402 payment header for premium audit access',
          }
        }
        const summaries = await this.audit.listRecent(Number(args.limit ?? 10))
        const events = await this.events.listRecent(Number(args.limit ?? 20))
        return { summaries, events }
      }
      default:
        throw new Error(`unsupported_read_tool:${tool}`)
    }
  }

  private async trace(
    sessionId: string,
    stepType: Parameters<AgentTraceRepository['insert']>[0]['stepType'],
    message: string,
    payload?: Record<string, unknown>,
  ): Promise<void> {
    const row = await this.traces.insert({
      sessionId,
      stepType,
      message,
      ...(payload ? { payload } : {}),
    })
    publishTrace(row)
  }
}

export { planSchema, READ_TOOL_NAMES, WRITE_TOOL_NAMES }
