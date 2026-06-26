import { readFileSync } from 'node:fs'
import {
  AccountHash,
  HttpHandler,
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  PublicKey,
  RpcClient,
  Transaction,
} from '@meridian/casper-sdk'
import type { Transaction as CasperTransaction } from 'casper-js-sdk'
import type { PaymentPayload } from './types.js'
import { hashAuthorization, isWithinTimeWindow } from './types.js'
import type { PolicyEngine, ReplayGuard } from './policy.js'

export interface VerifyResult {
  valid: boolean
  reason?: string
}

export interface SettleResult {
  success: boolean
  transactionHash?: string
  reason?: string
}

function createRpcClient(rpcUrl: string, apiKey: string | undefined): InstanceType<typeof RpcClient> {
  const handler = new HttpHandler(rpcUrl, 'fetch')
  if (apiKey) {
    handler.setCustomHeaders({ Authorization: apiKey })
  }
  return new RpcClient(handler)
}

function readDeployerPem(): string {
  const inline = process.env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM
  if (inline?.includes('BEGIN')) {
    return inline.replace(/\\n/g, '\n')
  }
  const pemPath =
    process.env.ODRA_CASPER_LIVENET_SECRET_KEY_PATH ??
    process.env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM
  if (!pemPath || pemPath.includes('BEGIN')) {
    throw new Error('deployer_pem_not_configured')
  }
  return readFileSync(pemPath, 'utf8')
}

function loadPayerFromPem(pemPathOrInline: string) {
  const pem = pemPathOrInline.includes('BEGIN') ? pemPathOrInline : readFileSync(pemPathOrInline, 'utf8')
  const preferred = process.env.MERIDIAN_DEPLOYER_KEY_ALGORITHM
  const order =
    preferred === 'ED25519'
      ? [KeyAlgorithm.ED25519, KeyAlgorithm.SECP256K1]
      : [KeyAlgorithm.SECP256K1, KeyAlgorithm.ED25519]
  for (const algorithm of order) {
    try {
      return PrivateKey.fromPem(pem, algorithm)
    } catch {
      /* try next algorithm */
    }
  }
  throw new Error('unable_to_parse_deployer_pem')
}

export class FacilitatorService {
  private readonly rpc: InstanceType<typeof RpcClient>

  constructor(
    rpcUrl: string,
    apiKey: string | undefined,
    private readonly chainName: string,
    private readonly payToAccountHash: string,
    private readonly replay: ReplayGuard,
    private readonly policy: PolicyEngine,
  ) {
    this.rpc = createRpcClient(rpcUrl, apiKey)
  }

  async verify(payload: PaymentPayload): Promise<VerifyResult> {
    const auth = payload.authorization
    const now = Math.floor(Date.now() / 1000)

    if (!isWithinTimeWindow(auth, now)) {
      return { valid: false, reason: 'authorization_expired' }
    }

    if (await this.replay.isUsed(auth.nonce)) {
      return { valid: false, reason: 'nonce_replay' }
    }

    const payToNormalized = this.payToAccountHash.startsWith('account-hash-')
      ? this.payToAccountHash
      : `account-hash-${this.payToAccountHash}`

    if (auth.to !== payToNormalized && auth.to !== payToNormalized.replace(/^account-hash-/, '')) {
      return { valid: false, reason: 'invalid_pay_to' }
    }

    try {
      this.policy.validate(BigInt(auth.value), payToNormalized)
    } catch (error) {
      return { valid: false, reason: error instanceof Error ? error.message : 'policy_reject' }
    }

    const domain = `${this.chainName}:x402`
    const digestHex = hashAuthorization(auth, domain)
    const digest = Buffer.from(digestHex, 'hex')
    try {
      const pubKey = PublicKey.fromHex(payload.publicKey)
      const signature = Buffer.from(payload.signature, 'hex')
      if (!pubKey.verifySignature(digest, signature)) {
        return { valid: false, reason: 'invalid_signature' }
      }
    } catch {
      return { valid: false, reason: 'signature_parse_error' }
    }

    return { valid: true }
  }

  async settle(payload: PaymentPayload): Promise<SettleResult> {
    const verification = await this.verify(payload)
    if (!verification.valid) {
      return { success: false, reason: verification.reason ?? 'verify_failed' }
    }

    try {
      let transaction: CasperTransaction
      if (payload.signedTransaction) {
        transaction = Transaction.fromJSON(payload.signedTransaction)
      } else {
        const payer = loadPayerFromPem(readDeployerPem())
        const recipient = AccountHash.fromString(
          payload.authorization.to.startsWith('account-hash-')
            ? payload.authorization.to
            : `account-hash-${payload.authorization.to}`,
        )
        transaction = new NativeTransferBuilder()
          .from(payer.publicKey)
          .targetAccountHash(recipient)
          .amount(payload.authorization.value)
          .id(Date.now())
          .chainName(this.chainName)
          .payment(2_500_000_000)
          .build()
        transaction.sign(payer)
      }

      const result = await this.rpc.putTransaction(transaction)
      const hash = result.transactionHash
      const transactionHash =
        typeof hash === 'string'
          ? hash
          : typeof hash?.toHex === 'function'
            ? hash.toHex()
            : JSON.stringify(hash).replace(/^"|"$/g, '')

      await this.replay.markUsed(payload.authorization.nonce)
      return {
        success: true,
        transactionHash,
      }
    } catch (error) {
      return {
        success: false,
        reason: error instanceof Error ? error.message : 'settle_failed',
      }
    }
  }

  getSupported() {
    return {
      kinds: [{ scheme: 'exact', network: this.chainName, asset: 'CSPR' }],
      x402Version: 1,
      payTo: this.payToAccountHash,
    }
  }
}

export function buildSignedPayment(input: {
  payerPemPath?: string
  payToAccountHash: string
  amountMotes: string
  chainName: string
}): PaymentPayload {
  const pemContent = input.payerPemPath
    ? input.payerPemPath.includes('BEGIN')
      ? input.payerPemPath
      : readFileSync(input.payerPemPath, 'utf8')
    : readDeployerPem()
  const payer = loadPayerFromPem(pemContent)
  const pubHex = payer.publicKey.toHex()
  const now = Math.floor(Date.now() / 1000)
  const payTo = input.payToAccountHash.startsWith('account-hash-')
    ? input.payToAccountHash
    : `account-hash-${input.payToAccountHash}`

  const authorization = {
    from: payer.publicKey.accountHash().toPrefixedString(),
    to: payTo,
    value: input.amountMotes,
    validAfter: now,
    validBefore: now + 300,
    nonce: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
  }
  const digest = Buffer.from(hashAuthorization(authorization, `${input.chainName}:x402`), 'hex')
  const signature = Buffer.from(payer.signAndAddAlgorithmBytes(digest)).toString('hex')

  const recipient = AccountHash.fromString(payTo)
  const transaction = new NativeTransferBuilder()
    .from(payer.publicKey)
    .targetAccountHash(recipient)
    .amount(input.amountMotes)
    .id(Date.now())
    .chainName(input.chainName)
    .payment(2_500_000_000)
    .build()
  transaction.sign(payer)

  return {
    authorization,
    signature,
    publicKey: pubHex,
    signedTransaction: transaction.toJSON(),
  }
}
