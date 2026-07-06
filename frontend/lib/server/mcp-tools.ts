import 'server-only'

export const WRITE_TOOL_NAMES = [
  'issue_token',
  'transfer_token',
  'register_holder',
  'revoke_holder',
  'delegate_stake',
  'restake',
  'distribute_rewards',
] as const

export type WriteToolName = (typeof WRITE_TOOL_NAMES)[number]

export function isWriteTool(tool: string): tool is WriteToolName {
  return (WRITE_TOOL_NAMES as readonly string[]).includes(tool)
}
