import {
  Args,
  CLValue,
  ContractCallBuilder,
  Key,
  NativeTransferBuilder,
  PublicKey,
} from '@meridian/casper-sdk'
import type { CLValue as CLValueType } from 'casper-js-sdk'
import type { DeployedAddresses } from '../config.js'

export interface UnsignedTransaction {
  network: string
  chainName: string
  transactionType: string
  transaction: unknown
  note: string
}

function normalizeAccountHash(value: string): string {
  return value.startsWith('account-hash-') ? value : `account-hash-${value}`
}

function keyFromAccountHash(accountHash: string) {
  return Key.newKey(normalizeAccountHash(accountHash))
}

function hexToBytes(value: string): Uint8Array {
  const hex = value.startsWith('0x') ? value.slice(2) : value
  const bytes = Buffer.from(hex, 'hex')
  return new Uint8Array(bytes)
}

export class TransactionBuilder {
  constructor(
    private readonly chainName: string,
    private readonly addresses: DeployedAddresses,
  ) {}

  private wrap(
    transactionType: string,
    transaction: { toJSON(): unknown },
    note: string,
  ): UnsignedTransaction {
    return {
      network: this.addresses.network,
      chainName: this.chainName,
      transactionType,
      transaction: transaction.toJSON(),
      note,
    }
  }

  private contractCall(
    callerPublicKeyHex: string,
    contractHash: string,
    entryPoint: string,
    args: Record<string, CLValueType>,
    paymentAmount: number,
    transactionType: string,
    note: string,
  ): UnsignedTransaction {
    const pk = PublicKey.fromHex(callerPublicKeyHex)
    const hash = contractHash.replace(/^hash-/, '')
    const transaction = new ContractCallBuilder()
      .from(pk)
      .byHash(hash)
      .entryPoint(entryPoint)
      .runtimeArgs(Args.fromMap(args))
      .chainName(this.chainName)
      .payment(paymentAmount)
      .build()
    return this.wrap(transactionType, transaction, note)
  }

  buildRegisterHolder(
    callerPublicKeyHex: string,
    holderAccountHash: string,
    attestationBytes: string,
  ): UnsignedTransaction {
    const registry = this.addresses.contracts.ComplianceRegistry
    if (!registry) throw new Error('ComplianceRegistry not deployed')
    return this.contractCall(
      callerPublicKeyHex,
      registry.contract_hash,
      'register_holder',
      {
        addr: CLValue.newCLKey(keyFromAccountHash(holderAccountHash)),
        attestation: CLValue.newCLByteArray(hexToBytes(attestationBytes)),
      },
      5_000_000_000,
      'register_holder',
      'Sign locally with CSPR.click or casper-client, then submit to RPC',
    )
  }

  buildTransferToken(
    callerPublicKeyHex: string,
    recipientAccountHash: string,
    amount: string,
  ): UnsignedTransaction {
    const token = this.addresses.contracts.MeridianToken
    if (!token) throw new Error('MeridianToken not deployed')
    return this.contractCall(
      callerPublicKeyHex,
      token.contract_hash,
      'transfer',
      {
        recipient: CLValue.newCLKey(keyFromAccountHash(recipientAccountHash)),
        amount: CLValue.newCLUInt256(amount),
      },
      5_000_000_000,
      'transfer_token',
      'Non-custodial unsigned TransactionV1 — caller must sign',
    )
  }

  buildRestake(
    callerPublicKeyHex: string,
    fromValidator: string,
    toValidator: string,
    amount: string,
  ): UnsignedTransaction {
    const vault = this.addresses.contracts.StakingVault
    if (!vault) throw new Error('StakingVault not deployed')
    return this.contractCall(
      callerPublicKeyHex,
      vault.contract_hash,
      'restake',
      {
        from: CLValue.newCLPublicKey(PublicKey.fromHex(fromValidator)),
        to: CLValue.newCLPublicKey(PublicKey.fromHex(toValidator)),
        amount: CLValue.newCLUInt512(amount),
      },
      50_000_000_000,
      'restake',
      'Requires CURATOR role after signing',
    )
  }

  buildDistributeRewards(callerPublicKeyHex: string, eraId: number): UnsignedTransaction {
    const vault = this.addresses.contracts.StakingVault
    if (!vault) throw new Error('StakingVault not deployed')
    const tx = this.contractCall(
      callerPublicKeyHex,
      vault.contract_hash,
      'distribute_rewards',
      {},
      50_000_000_000,
      'distribute_rewards',
      `Vault distribute_rewards for era ${eraId} — unsigned tx for local signing`,
    )
    return tx
  }

  buildRevokeHolder(
    callerPublicKeyHex: string,
    holder: string,
    reason: string,
  ): UnsignedTransaction {
    const registry = this.addresses.contracts.ComplianceRegistry
    if (!registry) throw new Error('ComplianceRegistry not deployed')
    return this.contractCall(
      callerPublicKeyHex,
      registry.contract_hash,
      'revoke',
      {
        addr: CLValue.newCLKey(keyFromAccountHash(holder)),
        reason: CLValue.newCLString(reason),
      },
      50_000_000_000,
      'revoke_holder',
      'Requires compliance officer role + timelock',
    )
  }

  buildIssueToken(
    callerPublicKeyHex: string,
    symbol: string,
    initialSupply: string,
  ): UnsignedTransaction {
    const token = this.addresses.contracts.MeridianToken
    if (!token) throw new Error('MeridianToken not deployed')
    const pk = PublicKey.fromHex(callerPublicKeyHex)
    return this.contractCall(
      callerPublicKeyHex,
      token.contract_hash,
      'transfer',
      {
        recipient: CLValue.newCLKey(keyFromAccountHash(pk.accountHash().toPrefixedString())),
        amount: CLValue.newCLUInt256(initialSupply),
      },
      5_000_000_000,
      'issue_token',
      `MRWA (${symbol}) uses fixed supply at deploy; this builds a self-transfer template for ${initialSupply} base units`,
    )
  }

  buildNativeTransfer(
    senderPublicKeyHex: string,
    recipientAccountHash: string,
    amountMotes: string,
  ): UnsignedTransaction {
    const pk = PublicKey.fromHex(senderPublicKeyHex)
    const transaction = new NativeTransferBuilder()
      .from(pk)
      .targetAccountHash(keyFromAccountHash(recipientAccountHash).account!)
      .amount(amountMotes)
      .id(Date.now())
      .chainName(this.chainName)
      .payment(2_500_000_000)
      .build()
    return this.wrap(
      'native_transfer',
      transaction,
      'Native CSPR transfer — sign locally',
    )
  }
}
