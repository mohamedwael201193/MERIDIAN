/** Casper testnet era length (blocks per era) — Casper 2.x */
export const BLOCKS_PER_ERA = 256

export function eraFromBlockHeight(blockHeight: number): number {
  if (blockHeight <= 0) {
    return 0
  }
  return Math.floor((blockHeight - 1) / BLOCKS_PER_ERA)
}

export function eraStartBlock(eraId: number): number {
  return eraId * BLOCKS_PER_ERA + 1
}

export function eraEndBlock(eraId: number): number {
  return (eraId + 1) * BLOCKS_PER_ERA
}
