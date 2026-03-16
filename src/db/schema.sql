CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    goal NUMERIC(12, 2) NOT NULL CHECK (goal > 0),
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'active', 'closed', 'cancelled', 'successful', 'failed')),
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_tiers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    quantity_total INTEGER NOT NULL CHECK (quantity_total >= 0),
    quantity_remaining INTEGER NOT NULL CHECK (
        quantity_remaining >= 0 AND quantity_remaining <= quantity_total
    )
);

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
