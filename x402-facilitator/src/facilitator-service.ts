import {
  AccountHash,
  HttpHandler,
  loadPrivateKeyFromPem,
  NativeTransferBuilder,
  PublicKey,
  RpcClient,
  Transaction,
} from '@meridian/casper-sdk'
import type { Transaction as CasperTransaction } from 'casper-js-sdk'
import { resolveInlinePemFromEnv } from '@meridian/env'
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

function createRpcClient(
  rpcUrl: string,
  apiKey: string | undefined,
): InstanceType<typeof RpcClient> {
  const handler = new HttpHandler(rpcUrl, 'fetch')
  if (apiKey) {
    handler.setCustomHeaders({ Authorization: apiKey })
  }
  return new RpcClient(handler)
}

function readDeployerPem(): string {
  return resolveInlinePemFromEnv(process.env.MERIDIAN_DEPLOYER_PRIVATE_KEY_PEM, 'deployer')
}

const CASPER_MESSAGE_HEADER = 'Casper Message:\n'

function casperWalletMessageBytes(message: string): Buffer {
  return Buffer.from(`${CASPER_MESSAGE_HEADER}${message}`, 'utf8')
}

function signatureVariants(signatureHex: string): Buffer[] {
  const hex = signatureHex.replace(/^0x/, '')
  const variants = [hex]
  if (hex.length === 128) variants.push(`01${hex}`, `02${hex}`)
  if (hex.length === 130) variants.push(hex.slice(2))
  return [...new Set(variants)].map((value) => Buffer.from(value, 'hex'))
}

function messageVariants(
  auth: PaymentPayload['authorization'],
  domain: string,
  signedMessage?: string,
): Buffer[] {
  const digestHex = hashAuthorization(auth, domain)
  const canonical = JSON.stringify({ domain, ...auth })
  const messages = [signedMessage, digestHex, canonical].filter((value): value is string =>
    Boolean(value),
  )
  const buffers: Buffer[] = [Buffer.from(digestHex, 'hex')]
  for (const message of new Set(messages)) {
    buffers.push(Buffer.from(message, 'utf8'))
    if (/^[0-9a-f]{64}$/i.test(message)) {
      buffers.push(casperWalletMessageBytes(message))
    }
  }
  return buffers
}

function loadDeployerKey() {
  const pem = readDeployerPem()
  return loadPrivateKeyFromPem(pem, process.env.MERIDIAN_DEPLOYER_KEY_ALGORITHM)
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
    try {
      const pubKey = PublicKey.fromHex(payload.publicKey)
      const verified = messageVariants(auth, domain, payload.message).some((message) =>
        signatureVariants(payload.signature).some((signature) => {
          try {
            return pubKey.verifySignature(message, signature)
          } catch {
            return false
          }
        }),
      )
      if (!verified) {
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
        const payer = loadDeployerKey()
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
      let transactionHash: string
      if (typeof hash === 'string') {
        transactionHash = hash
      } else {
        const withToHex = hash as { toHex?: () => string }
        transactionHash = withToHex.toHex?.() ?? JSON.stringify(hash).replace(/^"|"$/g, '')
      }

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
  payerPem?: string
  payToAccountHash: string
  amountMotes: string
  chainName: string
}): PaymentPayload {
  const pemContent = input.payerPem
    ? input.payerPem.includes('BEGIN')
      ? input.payerPem.replace(/\\n/g, '\n')
      : resolveInlinePemFromEnv(input.payerPem, 'payer')
    : readDeployerPem()
  const payer = loadPrivateKeyFromPem(pemContent, process.env.MERIDIAN_DEPLOYER_KEY_ALGORITHM)
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
    nonce: `${String(Date.now())}-${Math.random().toString(16).slice(2, 10)}`,
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
