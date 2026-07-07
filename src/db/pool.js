const { Pool } = require('pg');

function createPool() {
  const pool = new Pool({
    connectionString: process.env.PORTAL_DB_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  pool.on('error', (err) => {
    console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: 'pg pool error: ' + err.message }));
  });
  return pool;
}

async function ensureSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS auditor_users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS portal_login_attempts (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL,
      success BOOLEAN NOT NULL,
      ip TEXT,
      time TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS portal_login_attempts_time_idx ON portal_login_attempts (time);
  `);
}

module.exports = { createPool, ensureSchema };
