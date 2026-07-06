import { describe, expect, it } from 'vitest'
import { ALL_TOOL_NAMES } from '../../src/tools/write-tools.js'

describe('MCP tool registry', () => {
  it('exposes exactly 13 tools', () => {
    expect(ALL_TOOL_NAMES).toHaveLength(13)
    expect(new Set(ALL_TOOL_NAMES).size).toBe(13)
  })

  it('includes read and write tools', () => {
    expect(ALL_TOOL_NAMES).toContain('get_yield_rate')
    expect(ALL_TOOL_NAMES).toContain('delegate_stake')
    expect(ALL_TOOL_NAMES).toContain('transfer_token')
    expect(ALL_TOOL_NAMES).toContain('subscribe_audit')
  })
})
