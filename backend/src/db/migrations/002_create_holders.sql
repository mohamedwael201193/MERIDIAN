-- Compliance holders indexed from ComplianceRegistry events
CREATE TABLE IF NOT EXISTS meridian_holders (
  id BIGSERIAL PRIMARY KEY,
  account_hash TEXT NOT NULL UNIQUE,
  country SMALLINT,
  accredited BOOLEAN NOT NULL DEFAULT FALSE,
  sanctions_cleared BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meridian_holders_status ON meridian_holders (status);
