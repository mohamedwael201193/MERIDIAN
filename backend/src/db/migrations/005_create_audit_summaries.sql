-- Audit summaries from MeridianAudit contract + agent decisions
CREATE TABLE IF NOT EXISTS meridian_audit_summaries (
  id BIGSERIAL PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  decision_hash TEXT NOT NULL UNIQUE,
  transaction_hash TEXT,
  agent_public_key TEXT,
  event_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meridian_audit_period ON meridian_audit_summaries (period_end DESC);

-- Indexer checkpoint for restart recovery
CREATE TABLE IF NOT EXISTS indexer_checkpoints (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_block_height BIGINT NOT NULL DEFAULT 0,
  last_event_id BIGINT NOT NULL DEFAULT 0,
  last_backfill_tx TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO indexer_checkpoints (id, last_block_height, last_event_id)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;
