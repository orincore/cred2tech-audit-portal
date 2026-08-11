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

    CREATE TABLE IF NOT EXISTS blocked_ips (
      id BIGSERIAL PRIMARY KEY,
      ip TEXT NOT NULL UNIQUE,
      reason TEXT,
      blocked_by TEXT NOT NULL,
      blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      active BOOLEAN NOT NULL DEFAULT true,
      unblocked_by TEXT,
      unblocked_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS blocked_ips_active_idx ON blocked_ips (active);

    CREATE TABLE IF NOT EXISTS ip_block_audit_log (
      id BIGSERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      actor TEXT NOT NULL,
      detail TEXT,
      time TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ip_block_audit_log_time_idx ON ip_block_audit_log (time);
  `);
}

module.exports = { createPool, ensureSchema };
