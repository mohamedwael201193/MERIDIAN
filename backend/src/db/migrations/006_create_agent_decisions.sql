-- Agent decisions (Phase 6)
CREATE TABLE IF NOT EXISTS meridian_agent_decisions (
  id BIGSERIAL PRIMARY KEY,
  agent_name TEXT NOT NULL,
  decision_hash TEXT NOT NULL UNIQUE,
  decision_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  approved BOOLEAN,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON meridian_agent_decisions (agent_name, created_at DESC);
