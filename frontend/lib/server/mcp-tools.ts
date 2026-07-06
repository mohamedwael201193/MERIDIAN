import 'server-only'

export const WRITE_TOOL_NAMES = [
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'delegate_stake',
  'deposit_to_vault',
  'restake',
  'distribute_rewards',
] as const

export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number]

export function isWriteTool(tool: string): tool is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(tool)
}
