-- MERIDIAN tokens indexed from chain events
CREATE TABLE IF NOT EXISTS meridian_tokens (
  id BIGSERIAL PRIMARY KEY,
  package_hash TEXT NOT NULL UNIQUE,
  contract_name TEXT NOT NULL,
  symbol TEXT,
  total_supply NUMERIC(78, 0) NOT NULL DEFAULT 0,
  total_staked NUMERIC(78, 0) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meridian_tokens_name ON meridian_tokens (contract_name);
