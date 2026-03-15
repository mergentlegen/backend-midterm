const { Pool } = require("pg");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "crowdfunding",
      password: process.env.DB_PASSWORD || "postgres",
      port: Number(process.env.DB_PORT) || 5432,
    };

const shouldUseSsl =
  process.env.DB_SSL === "true" ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon.tech"));

if (shouldUseSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

module.exports = pool;
