import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TransactionBuilder } from '../../src/casper/tx-builder.js'
import type { DeployedAddresses } from '../../src/config.js'

const addresses = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../../deployed/addresses.json'), 'utf8'),
) as DeployedAddresses

const CALLER = '0203d64d1b7f66f18c0abe9836df604c187797ddb962b9fc3396201c245f9de335a6'
const RECIPIENT = 'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27'

describe('TransactionBuilder', () => {
  const builder = new TransactionBuilder('casper-test', addresses)

  it('builds transfer_token unsigned tx', () => {
    const tx = builder.buildTransferToken(CALLER, RECIPIENT, '1000000')
    expect(tx.transactionType).toBe('transfer_token')
    expect(tx.transaction).toBeTruthy()
    expect(tx.chainName).toBe('casper-test')
    const payload = (tx.transaction as { payload?: { fields?: { target?: unknown } } }).payload
    expect(payload?.fields?.target).toMatchObject({
      Stored: { id: { ByPackageHash: { addr: expect.any(String) } } },
    })
  })

  it('builds distribute_rewards unsigned tx', () => {
    const tx = builder.buildDistributeRewards(CALLER, 42)
    expect(tx.transactionType).toBe('distribute_rewards')
  })
})
