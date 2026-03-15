BEGIN;

CREATE TABLE IF NOT EXISTS pledges (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  backer_id INTEGER NOT NULL REFERENCES users(id),
  tier_id INTEGER REFERENCES reward_tiers(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id SERIAL PRIMARY KEY,
  pledge_id INTEGER NOT NULL REFERENCES pledges(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pledges_project_id ON pledges(project_id);
CREATE INDEX IF NOT EXISTS idx_pledges_backer_id ON pledges(backer_id);
CREATE INDEX IF NOT EXISTS idx_pledges_tier_id ON pledges(tier_id);
CREATE INDEX IF NOT EXISTS idx_refunds_pledge_id ON refunds(pledge_id);

COMMIT;
