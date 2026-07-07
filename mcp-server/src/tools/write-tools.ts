import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { TransactionBuilder } from '../casper/tx-builder.js'
import { MIN_DELEGATION_MOTES } from '../casper/tx-builder.js'

const publicKeySchema = z.string().regex(/^0[123][0-9a-fA-F]{64,66}$/)
const accountHashSchema = z
  .string()
  .min(10)
  .describe('Casper account hash, with or without account-hash- prefix')
const motesSchema = z
  .string()
  .regex(/^\d+$/)
  .describe('Amount in motes (1 CSPR = 1_000_000_000 motes)')

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

export function registerWriteTools(server: McpServer, txBuilder: TransactionBuilder): void {
  server.registerTool(
    'transfer_token',
    {
      description:
        'Build unsigned TransactionV1 for MRWA token transfer. Wallet signature required. No special role.',
      inputSchema: {
        callerPublicKey: publicKeySchema.describe(
          'Ed25519/secp256k1 public key of the signing wallet',
        ),
        recipientAccountHash: accountHashSchema,
        amount: motesSchema.describe('MRWA amount in smallest units'),
      },
    },
    ({ callerPublicKey, recipientAccountHash, amount }) =>
      textResult(txBuilder.buildTransferToken(callerPublicKey, recipientAccountHash, amount)),
  )

  server.registerTool(
    'register_holder',
    {
      description:
        'Build unsigned TransactionV1 to register a compliant holder in ComplianceRegistry. Deployed contract requires CONTRACT_OWNER signer.',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        holderAccountHash: accountHashSchema,
        attestationBytes: z
          .string()
          .min(2)
          .describe(
            'Odra Attestation bytesrepr hex (u32,bool,u64,bool) or "default" for permissive testnet attestation',
          ),
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
      description:
        'Build unsigned TransactionV1 to revoke a holder. COMPLIANCE_OFFICER role required on-chain.',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        holderAccountHash: accountHashSchema,
        reason: z.string().min(1).max(500),
      },
    },
    ({ callerPublicKey, holderAccountHash, reason }) =>
      textResult(txBuilder.buildRevokeHolder(callerPublicKey, holderAccountHash, reason)),
  )

  server.registerTool(
    'delegate_stake',
    {
      description: `Build unsigned native Casper delegation from the user's wallet. Minimum ${MIN_DELEGATION_MOTES.toString()} motes (500 CSPR). Separate from MERIDIAN vault staking.`,
      inputSchema: {
        callerPublicKey: publicKeySchema,
        validator: publicKeySchema.describe('Validator public key from list_validators'),
        amount: motesSchema.describe(
          `Must be >= ${MIN_DELEGATION_MOTES.toString()} motes (500 CSPR)`,
        ),
      },
    },
    ({ callerPublicKey, validator, amount }) =>
      textResult(txBuilder.buildDelegateStake(callerPublicKey, validator, amount)),
  )

  server.registerTool(
    'deposit_to_vault',
    {
      description:
        'Currently fails honestly: StakingVault deposit requires Odra payable __cargo_purse wiring that browser TransactionV1 builder does not attach yet.',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        amount: motesSchema.describe('CSPR motes to deposit into the vault'),
      },
    },
    ({ callerPublicKey, amount }) =>
      textResult(txBuilder.buildDepositToVault(callerPublicKey, amount)),
  )

  server.registerTool(
    'restake',
    {
      description:
        'Curator-only: builds unsigned TransactionV1 for vault restake between validators. Requires VALIDATOR_CURATOR role.',
      inputSchema: {
        callerPublicKey: publicKeySchema,
        fromValidator: publicKeySchema,
        toValidator: publicKeySchema,
        amount: motesSchema,
      },
    },
    ({ callerPublicKey, fromValidator, toValidator, amount }) =>
      textResult(txBuilder.buildRestake(callerPublicKey, fromValidator, toValidator, amount)),
  )

  server.registerTool(
    'distribute_rewards',
    {
      description:
        'Currently fails honestly: StakingVault distribute_rewards requires YieldDistributor contract caller, not a user wallet.',
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
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'delegate_stake',
  'deposit_to_vault',
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
