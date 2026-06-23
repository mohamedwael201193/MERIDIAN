-- Yield distributions indexed from YieldDistributor events
CREATE TABLE IF NOT EXISTS meridian_distributions (
  id BIGSERIAL PRIMARY KEY,
  era_id BIGINT NOT NULL,
  block_height BIGINT NOT NULL,
  transaction_hash TEXT NOT NULL,
  total_rewards NUMERIC(78, 0) NOT NULL DEFAULT 0,
  protocol_fee NUMERIC(78, 0) NOT NULL DEFAULT 0,
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (transaction_hash, era_id)
);

CREATE INDEX IF NOT EXISTS idx_meridian_distributions_era ON meridian_distributions (era_id DESC);
