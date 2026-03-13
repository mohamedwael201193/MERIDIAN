'use client';

import { HttpHandler, RpcClient, Transaction } from 'casper-js-sdk';

const RPC_URL = 'https://node.testnet.casper.network/rpc';

export type TxPollStatus = 'pending' | 'processed' | 'finalized' | 'failed' | 'unknown';

export interface TxPollResult {
  status: TxPollStatus;
  detail?: string;
}

function getRpcClient() {
  return new RpcClient(new HttpHandler(RPC_URL));
}

export async function submitSignedTransaction(signedTransaction: unknown): Promise<string> {
  const rpc = getRpcClient();
  const result = await rpc.putTransaction(signedTransaction as Transaction);
  return String(result.transactionHash);
}

export async function pollTransactionStatus(
  transactionHash: string,
  maxAttempts = 30,
  intervalMs = 4000,
): Promise<TxPollResult> {
  const rpc = getRpcClient();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const info = await rpc.getTransactionByTransactionHash(transactionHash);
      const execution = (info as { executionInfo?: { executionResult?: { errorMessage?: string } } })
        .executionInfo;
      const result = execution?.executionResult;

      if (result && 'errorMessage' in result && result.errorMessage) {
        return { status: 'failed', detail: String(result.errorMessage) };
      }

      const raw = info as unknown as {
        transaction?: { hash?: string };
        executionInfo?: unknown;
      };
      if (raw.executionInfo) {
        if (attempt >= 2) {
          return { status: 'finalized' };
        }
        return { status: 'processed' };
      }
    } catch {
      // Transaction may not be indexed yet
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  return { status: 'pending', detail: 'Timed out waiting for finality' };
}
