import {
  Args,
  CLValue,
  ContractCallBuilder,
  Key,
  NativeDelegateBuilder,
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
  attachedValueMotes?: string
  requiredRole?: string
  expectedResult?: string
  explorerHint?: string
}

/** Casper protocol minimum delegation: 500 CSPR */
export const MIN_DELEGATION_MOTES = 500_000_000_000n

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
    packageHash: string,
    entryPoint: string,
    args: Record<string, CLValueType>,
    paymentAmount: number,
    transactionType: string,
    note: string,
  ): UnsignedTransaction {
    const pk = PublicKey.fromHex(callerPublicKeyHex)
    const hash = packageHash.replace(/^contract-package-/, '').replace(/^hash-/, '')
    const transaction = new ContractCallBuilder()
      .from(pk)
      .byPackageHash(hash)
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
      registry.package_hash,
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
      token.package_hash,
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
    const tx = this.contractCall(
      callerPublicKeyHex,
      vault.package_hash,
      'restake',
      {
        from: CLValue.newCLPublicKey(PublicKey.fromHex(fromValidator)),
        to: CLValue.newCLPublicKey(PublicKey.fromHex(toValidator)),
        amount: CLValue.newCLUInt512(amount),
      },
      50_000_000_000,
      'restake',
      'Requires VALIDATOR_CURATOR role after signing',
    )
    return { ...tx, requiredRole: 'VALIDATOR_CURATOR' }
  }

  buildDelegateStake(
    callerPublicKeyHex: string,
    validatorPublicKeyHex: string,
    amountMotes: string,
  ): UnsignedTransaction {
    const amount = BigInt(amountMotes)
    if (amount < MIN_DELEGATION_MOTES) {
      throw new Error(
        `Minimum native delegation is 500 CSPR (${MIN_DELEGATION_MOTES.toString()} motes). Got ${amountMotes} motes.`,
      )
    }
    const pk = PublicKey.fromHex(callerPublicKeyHex)
    const validator = PublicKey.fromHex(validatorPublicKeyHex)
    const transaction = new NativeDelegateBuilder()
      .from(pk)
      .validator(validator)
      .amount(amountMotes)
      .chainName(this.chainName)
      .payment(5_000_000_000)
      .build()
    return this.wrap(
      'delegate_stake',
      transaction,
      `Native Casper delegation of ${amountMotes} motes (min 500 CSPR enforced). Sign in wallet to delegate.`,
    )
  }

  buildDepositToVault(callerPublicKeyHex: string, amountMotes: string): UnsignedTransaction {
    const vault = this.addresses.contracts.StakingVault
    if (!vault) throw new Error('StakingVault not deployed')
    if (BigInt(amountMotes) <= 0n) throw new Error('deposit amount must be positive')
    const tx = this.contractCall(
      callerPublicKeyHex,
      vault.package_hash,
      'deposit',
      {},
      50_000_000_000,
      'deposit_to_vault',
      `MERIDIAN vault deposit of ${amountMotes} motes. Wallet must attach ${amountMotes} motes as payable value when signing.`,
    )
    return {
      ...tx,
      attachedValueMotes: amountMotes,
      expectedResult: 'CSPR deposited into StakingVault; vault delegates on your behalf',
      explorerHint: 'https://testnet.cspr.live',
    }
  }

  buildDistributeRewards(callerPublicKeyHex: string, eraId: number): UnsignedTransaction {
    const vault = this.addresses.contracts.StakingVault
    if (!vault) throw new Error('StakingVault not deployed')
    const tx = this.contractCall(
      callerPublicKeyHex,
      vault.package_hash,
      'distribute_rewards',
      {},
      50_000_000_000,
      'distribute_rewards',
      `Vault distribute_rewards for era ${String(eraId)} — unsigned tx for local signing`,
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
    const tx = this.contractCall(
      callerPublicKeyHex,
      registry.package_hash,
      'revoke',
      {
        addr: CLValue.newCLKey(keyFromAccountHash(holder)),
        reason: CLValue.newCLString(reason),
      },
      50_000_000_000,
      'revoke_holder',
      'Requires compliance officer role + timelock',
    )
    return { ...tx, requiredRole: 'COMPLIANCE_OFFICER' }
  }

  buildNativeTransfer(
    senderPublicKeyHex: string,
    recipientAccountHash: string,
    amountMotes: string,
  ): UnsignedTransaction {
    const pk = PublicKey.fromHex(senderPublicKeyHex)
    const recipientKey = keyFromAccountHash(recipientAccountHash)
    const recipientAccount = recipientKey.account
    if (!recipientAccount) throw new Error('Invalid recipient account hash')
    const transaction = new NativeTransferBuilder()
      .from(pk)
      .targetAccountHash(recipientAccount)
      .amount(amountMotes)
      .id(Date.now())
      .chainName(this.chainName)
      .payment(2_500_000_000)
      .build()
    return this.wrap('native_transfer', transaction, 'Native CSPR transfer — sign locally')
  }
}
