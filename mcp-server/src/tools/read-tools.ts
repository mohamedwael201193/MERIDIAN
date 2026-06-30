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
  server.tool(
    'get_token_info',
    'Returns MERIDIAN token metadata from indexed backend + deployed addresses',
    { packageHash: z.string().optional() },
    async ({ packageHash }) => {
      const hash = packageHash ?? addresses.contracts.MeridianToken?.package_hash ?? ''
      const token = await backend.getToken(hash)
      return textResult({ deployed: addresses.contracts, indexed: token.data })
    },
  )

  server.tool(
    'get_yield_rate',
    'Returns current yield/APY for a MERIDIAN token from live indexed data',
    { packageHash: z.string().optional() },
    async ({ packageHash }) => {
      const hash = packageHash ?? addresses.contracts.MeridianToken?.package_hash ?? ''
      const yieldData = await backend.getYield(hash)
      return textResult(yieldData.data)
    },
  )

  server.tool(
    'get_holder_yield',
    'Returns yield history and holder-relevant distribution data',
    { limit: z.number().int().min(1).max(100).optional() },
    async ({ limit }) => {
      const history = await backend.getYieldHistory(limit ?? 20)
      return textResult(history.data)
    },
  )

  server.tool(
    'get_compliance_status',
    'Returns compliance status for an account hash from indexed registry data',
    { accountHash: z.string().min(10) },
    async ({ accountHash }) => {
      const status = await backend.getCompliance(accountHash)
      return textResult(status.data)
    },
  )

  server.tool(
    'list_validators',
    'Lists Casper testnet auction validators from live RPC',
    { limit: z.number().int().min(1).max(50).optional() },
    async ({ limit }) => {
      const validators = await rpc.getAuctionValidators(limit ?? 10)
      return textResult({ validators, network: addresses.network })
    },
  )

  server.tool(
    'subscribe_audit',
    'Returns audit trail summaries; x402 payment required via resource server when X-PAYMENT missing',
    { limit: z.number().int().min(1).max(50).optional(), paymentHeader: z.string().optional() },
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
