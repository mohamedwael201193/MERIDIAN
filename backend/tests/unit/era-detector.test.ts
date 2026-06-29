import { describe, expect, it } from 'vitest'
import { eraFromBlockHeight, eraStartBlock, BLOCKS_PER_ERA } from '../../src/indexer/era-detector.js'

describe('era-detector', () => {
  it('computes era from block height', () => {
    expect(eraFromBlockHeight(1)).toBe(0)
    expect(eraFromBlockHeight(BLOCKS_PER_ERA)).toBe(0)
    expect(eraFromBlockHeight(BLOCKS_PER_ERA + 1)).toBe(1)
    expect(eraStartBlock(1)).toBe(BLOCKS_PER_ERA + 1)
  })
})
