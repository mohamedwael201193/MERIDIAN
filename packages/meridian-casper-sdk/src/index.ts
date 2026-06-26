import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const sdk = require('casper-js-sdk') as typeof import('casper-js-sdk')

export const {
  AccountHash,
  Args,
  CLValue,
  ContractCallBuilder,
  HttpHandler,
  Key,
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  PublicKey,
  RpcClient,
  Transaction,
} = sdk

export type { Transaction as CasperTransaction } from 'casper-js-sdk'
