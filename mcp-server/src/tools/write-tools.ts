import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { TransactionBuilder } from '../casper/tx-builder.js'

const publicKeySchema = z.string().regex(/^0[23][0-9a-fA-F]{64,66}$/)

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

export function registerWriteTools(server: McpServer, txBuilder: TransactionBuilder): void {
  server.tool(
    'issue_token',
    'Builds unsigned TransactionV1 to mint MRWA tokens (non-custodial)',
    {
      callerPublicKey: publicKeySchema,
      symbol: z.string().default('MRWA'),
      initialSupply: z.string().regex(/^\d+$/),
    },
    async ({ callerPublicKey, symbol, initialSupply }) =>
      textResult(txBuilder.buildIssueToken(callerPublicKey, symbol, initialSupply)),
  )

  server.tool(
    'transfer_token',
    'Builds unsigned TransactionV1 for MRWA transfer (non-custodial)',
    {
      callerPublicKey: publicKeySchema,
      recipientAccountHash: z.string().min(10),
      amount: z.string().regex(/^\d+$/),
    },
    async ({ callerPublicKey, recipientAccountHash, amount }) =>
      textResult(txBuilder.buildTransferToken(callerPublicKey, recipientAccountHash, amount)),
  )

  server.tool(
    'register_holder',
    'Builds unsigned TransactionV1 to register a compliant holder',
    {
      callerPublicKey: publicKeySchema,
      holderAccountHash: z.string().min(10),
      attestationBytes: z.string().min(2),
    },
    async ({ callerPublicKey, holderAccountHash, attestationBytes }) =>
      textResult(
        txBuilder.buildRegisterHolder(callerPublicKey, holderAccountHash, attestationBytes),
      ),
  )

  server.tool(
    'revoke_holder',
    'Builds unsigned TransactionV1 to revoke a holder (compliance officer)',
    {
      callerPublicKey: publicKeySchema,
      holderAccountHash: z.string().min(10),
      reason: z.string().min(1).max(500),
    },
    async ({ callerPublicKey, holderAccountHash, reason }) =>
      textResult(txBuilder.buildRevokeHolder(callerPublicKey, holderAccountHash, reason)),
  )

  server.tool(
    'restake',
    'Builds unsigned TransactionV1 for vault restake between validators',
    {
      callerPublicKey: publicKeySchema,
      fromValidator: publicKeySchema,
      toValidator: publicKeySchema,
      amount: z.string().regex(/^\d+$/),
    },
    async ({ callerPublicKey, fromValidator, toValidator, amount }) =>
      textResult(txBuilder.buildRestake(callerPublicKey, fromValidator, toValidator, amount)),
  )

  server.tool(
    'distribute_rewards',
    'Builds unsigned TransactionV1 for yield distribution',
    {
      callerPublicKey: publicKeySchema,
      eraId: z.number().int().nonnegative(),
    },
    async ({ callerPublicKey, eraId }) =>
      textResult(txBuilder.buildDistributeRewards(callerPublicKey, eraId)),
  )
}

export const WRITE_TOOL_NAMES = [
  'issue_token',
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'restake',
  'distribute_rewards',
] as const

export const READ_TOOL_NAMES = [
  'get_token_info',
  'get_yield_rate',
  'get_holder_yield',
  'get_compliance_status',
  'list_validators',
  'subscribe_audit',
] as const

export const ALL_TOOL_NAMES = [...READ_TOOL_NAMES, ...WRITE_TOOL_NAMES] as const
