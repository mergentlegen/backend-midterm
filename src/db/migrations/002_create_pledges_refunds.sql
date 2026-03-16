BEGIN;

ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE projects
ADD CONSTRAINT projects_status_check
CHECK (status IN ('draft', 'active', 'closed', 'cancelled', 'successful', 'failed'));

CREATE TABLE IF NOT EXISTS pledges (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    backer_id INTEGER NOT NULL REFERENCES users(id),
    tier_id INTEGER REFERENCES reward_tiers(id),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'refunded')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    pledge_id INTEGER NOT NULL UNIQUE REFERENCES pledges(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processed', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
