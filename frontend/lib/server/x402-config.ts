import 'server-only'

const DEFAULT_PAY_TO =
  'account-hash-267bc977600c9512c0ce5e96af4d0057d514998cc752e28b8f5e91b654a72c27'

export function getX402Amount(): string {
  return process.env.X402_PAYMENT_AMOUNT_MOTES ?? '2500000000'
}

export function getX402PayTo(): string {
  return process.env.X402_PAY_TO_ACCOUNT_HASH ?? DEFAULT_PAY_TO
}

export function getX402Network(): string {
  return process.env.CASPER_CHAIN_NAME ?? process.env.NEXT_PUBLIC_CASPER_NETWORK ?? 'casper-test'
}

export function buildX402PaymentRequired(resourcePath: string) {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: 'exact',
        network: getX402Network(),
        maxAmountRequired: getX402Amount(),
        resource: resourcePath,
        payTo: getX402PayTo(),
        asset: 'CSPR',
      },
    ],
  }
}
