-- Agent execution traces (Planner + MCP workflow visibility)
CREATE TABLE IF NOT EXISTS meridian_agent_traces (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  agent_name TEXT NOT NULL DEFAULT 'planner',
  step_type TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_traces_session ON meridian_agent_traces (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_agent_traces_created ON meridian_agent_traces (created_at DESC);
