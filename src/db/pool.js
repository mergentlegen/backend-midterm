const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const shouldUseSsl =
  process.env.DB_SSL === "true" || (connectionString && connectionString.includes("neon.tech"));

const poolConfig = {
  connectionString,
};

if (shouldUseSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;
