-- Raw contract events from CSPR.cloud streaming / backfill
CREATE TABLE IF NOT EXISTS meridian_events (
  id BIGSERIAL PRIMARY KEY,
  contract_name TEXT NOT NULL,
  contract_package_hash TEXT NOT NULL,
  contract_hash TEXT,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_data TEXT,
  block_height BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  transform_id BIGINT,
  transaction_hash TEXT NOT NULL,
  indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (block_height, event_id, contract_package_hash, event_name)
);

CREATE INDEX IF NOT EXISTS idx_meridian_events_tx ON meridian_events (transaction_hash);
CREATE INDEX IF NOT EXISTS idx_meridian_events_name ON meridian_events (event_name);
CREATE INDEX IF NOT EXISTS idx_meridian_events_block ON meridian_events (block_height DESC);
