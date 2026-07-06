import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { TransactionBuilder } from '../casper/tx-builder.js'

const publicKeySchema = z.string().regex(/^0[123][0-9a-fA-F]{64,66}$/)

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

export function registerWriteTools(server: McpServer, txBuilder: TransactionBuilder): void {
  server.registerTool(
    'issue_token',
    {
      description:
        'Disabled: MRWA fixed supply was minted at deployment; use transfer_token instead',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        symbol: z.string().default('MRWA'),
        initialSupply: z.string().regex(/^\d+$/),
      },
    },
    ({ callerPublicKey, symbol, initialSupply }) =>
      textResult(txBuilder.buildIssueToken(callerPublicKey, symbol, initialSupply)),
  )

  server.registerTool(
    'transfer_token',
    {
      description: 'Builds unsigned TransactionV1 for MRWA transfer (non-custodial)',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        recipientAccountHash: z.string().min(10),
        amount: z.string().regex(/^\d+$/),
      },
    },
    ({ callerPublicKey, recipientAccountHash, amount }) =>
      textResult(txBuilder.buildTransferToken(callerPublicKey, recipientAccountHash, amount)),
  )

  server.registerTool(
    'register_holder',
    {
      description: 'Builds unsigned TransactionV1 to register a compliant holder',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        holderAccountHash: z.string().min(10),
        attestationBytes: z.string().min(2),
      },
    },
    ({ callerPublicKey, holderAccountHash, attestationBytes }) =>
      textResult(
        txBuilder.buildRegisterHolder(callerPublicKey, holderAccountHash, attestationBytes),
      ),
  )

  server.registerTool(
    'revoke_holder',
    {
      description: 'Builds unsigned TransactionV1 to revoke a holder (compliance officer)',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        holderAccountHash: z.string().min(10),
        reason: z.string().min(1).max(500),
      },
    },
    ({ callerPublicKey, holderAccountHash, reason }) =>
      textResult(txBuilder.buildRevokeHolder(callerPublicKey, holderAccountHash, reason)),
  )

  server.registerTool(
    'delegate_stake',
    {
      description: 'Builds unsigned native Casper delegation transaction for user staking',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        validator: publicKeySchema,
        amount: z.string().regex(/^\d+$/),
      },
    },
    ({ callerPublicKey, validator, amount }) =>
      textResult(txBuilder.buildDelegateStake(callerPublicKey, validator, amount)),
  )

  server.registerTool(
    'restake',
    {
      description:
        'Curator-only: builds unsigned TransactionV1 for vault restake between validators',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        fromValidator: publicKeySchema,
        toValidator: publicKeySchema,
        amount: z.string().regex(/^\d+$/),
      },
    },
    ({ callerPublicKey, fromValidator, toValidator, amount }) =>
      textResult(txBuilder.buildRestake(callerPublicKey, fromValidator, toValidator, amount)),
  )

  server.registerTool(
    'distribute_rewards',
    {
      description: 'Builds unsigned TransactionV1 for yield distribution',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        eraId: z.number().int().nonnegative(),
      },
    },
    ({ callerPublicKey, eraId }) =>
      textResult(txBuilder.buildDistributeRewards(callerPublicKey, eraId)),
  )
}

export const WRITE_TOOL_NAMES = [
  'issue_token',
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'delegate_stake',
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
