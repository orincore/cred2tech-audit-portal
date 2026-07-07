require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');

test('ensureSchema creates auditor_users and portal_login_attempts', async (t) => {
  if (!process.env.TEST_AUDIT_DB_URL) {
    t.skip('TEST_AUDIT_DB_URL not set — skipping integration test');
    return;
  }
  process.env.PORTAL_DB_URL = process.env.TEST_AUDIT_DB_URL;
  const { createPool, ensureSchema } = require('../src/db/pool');
  const pool = createPool();
  await ensureSchema(pool);

  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_name IN ('auditor_users', 'portal_login_attempts')`
  );
  assert.equal(rows.length, 2);
  await pool.end();
});
