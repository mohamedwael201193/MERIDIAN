import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { BackendClient } from '../clients/backend-client.js'
import type { RpcClient } from '../clients/rpc-client.js'
import type { DeployedAddresses } from '../config.js'

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

export function registerReadTools(
  server: McpServer,
  backend: BackendClient,
  rpc: RpcClient,
  addresses: DeployedAddresses,
): void {
  server.registerTool(
    'get_token_info',
    {
      description:
        'Read MRWA token metadata, deployed contract addresses, and indexed supply. No wallet required.',
      inputSchema: {
        packageHash: z
          .string()
          .optional()
          .describe('MeridianToken package hash; defaults to deployed MRWA'),
      },
    },
    async ({ packageHash }) => {
      const hash = packageHash ?? addresses.contracts.MeridianToken?.package_hash ?? ''
      const token = await backend.getToken(hash)
      return textResult({ deployed: addresses.contracts, indexed: token.data })
    },
  )

  server.registerTool(
    'get_yield_rate',
    {
      description:
        'Read current estimated APY and total staked CSPR for MRWA from the live indexer. No wallet required.',
      inputSchema: {
        packageHash: z.string().optional(),
      },
    },
    async ({ packageHash }) => {
      const hash = packageHash ?? addresses.contracts.MeridianToken?.package_hash ?? ''
      const yieldData = await backend.getYield(hash)
      return textResult(yieldData.data)
    },
  )

  server.registerTool(
    'get_holder_yield',
    {
      description: 'Read recent global yield distribution history from the backend indexer.',
      inputSchema: {
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Max history rows (default 20)'),
      },
    },
    async ({ limit }) => {
      const history = await backend.getYieldHistory(limit ?? 20)
      return textResult(history.data)
    },
  )

  server.registerTool(
    'get_compliance_status',
    {
      description:
        'Read ComplianceRegistry status for a holder account hash. Use before register_holder or revoke_holder.',
      inputSchema: {
        accountHash: z.string().min(10).describe('Holder account hash'),
      },
    },
    async ({ accountHash }) => {
      const status = await backend.getCompliance(accountHash)
      return textResult(status.data)
    },
  )

  server.registerTool(
    'list_validators',
    {
      description:
        'Read active Casper auction validators from live RPC. Use before delegate_stake to pick a validator.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async ({ limit }) => {
      const validators = await rpc.getAuctionValidators(limit ?? 10)
      return textResult({ validators, network: addresses.network })
    },
  )

  server.registerTool(
    'subscribe_audit',
    {
      description:
        'Read premium audit summaries and events. Returns 402 hint without X-PAYMENT header; pay via x402 then retry.',
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional(),
        paymentHeader: z
          .string()
          .optional()
          .describe('x402 payment authorization header after wallet payment'),
      },
    },
    async ({ limit, paymentHeader }) => {
      if (!paymentHeader) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'PAYMENT_REQUIRED',
                status: 402,
                resource: '/api/audit/subscribe',
                facilitator: process.env.X402_FACILITATOR_URL ?? 'http://127.0.0.1:3001',
                hint: 'Complete x402 payment flow, then retry with paymentHeader',
              }),
            },
          ],
          isError: true,
        }
      }
      const summaries = await backend.getAuditSummaries(limit ?? 10)
      const events = await backend.getEvents(limit ?? 20)
      return textResult({ summaries: summaries.data, events: events.data })
    },
  )
}
