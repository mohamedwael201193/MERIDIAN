-- Phase 8: x402 payment audit trail
CREATE TABLE IF NOT EXISTS x402_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  resource_path TEXT NOT NULL,
  payer_account_hash TEXT NOT NULL,
  pay_to_account_hash TEXT NOT NULL,
  amount_motes BIGINT NOT NULL,
  network TEXT NOT NULL DEFAULT 'casper-test',
  verify_valid BOOLEAN NOT NULL DEFAULT false,
  settled BOOLEAN NOT NULL DEFAULT false,
  transaction_hash TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_x402_payments_settled ON x402_payments (settled, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_x402_payments_tx ON x402_payments (transaction_hash) WHERE transaction_hash IS NOT NULL;
