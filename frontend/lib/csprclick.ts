import {
  CONTENT_MODE,
  WALLET_KEYS,
  type CsprClickInitOptions,
} from '@make-software/csprclick-core-types'
import { MERIDIAN_NETWORK } from './contracts'

const CSPRCLICK_APP_ID = process.env.NEXT_PUBLIC_CSPRCLICK_APP_ID ?? 'csprclick-template'

export function getCsprClickConfig(): CsprClickInitOptions {
  return {
    appName: 'MERIDIAN',
    appId: CSPRCLICK_APP_ID,
    contentMode: CONTENT_MODE.IFRAME,
    providers: [WALLET_KEYS.CASPER_WALLET],
    chainName: MERIDIAN_NETWORK,
    casperNode:
      process.env.NEXT_PUBLIC_CASPER_RPC_URL ??
      process.env.CASPER_RPC_URL ??
      'https://node.testnet.cspr.cloud/rpc',
    logLevel: 2,
  }
}
