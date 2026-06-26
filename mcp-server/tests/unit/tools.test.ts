import { describe, expect, it } from 'vitest'
import { ALL_TOOL_NAMES } from '../../src/tools/write-tools.js'

describe('MCP tool registry', () => {
  it('exposes exactly 12 tools', () => {
    expect(ALL_TOOL_NAMES).toHaveLength(12)
    expect(new Set(ALL_TOOL_NAMES).size).toBe(12)
  })

  it('includes read and write tools', () => {
    expect(ALL_TOOL_NAMES).toContain('get_yield_rate')
    expect(ALL_TOOL_NAMES).toContain('transfer_token')
    expect(ALL_TOOL_NAMES).toContain('subscribe_audit')
  })
})
