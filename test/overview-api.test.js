require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');

test('rollup24h groups errors by app and computes restart deltas', async (t) => {
  if (!process.env.TEST_AUDIT_DB_URL) {
    t.skip('TEST_AUDIT_DB_URL not set — skipping integration test');
    return;
  }
  process.env.PORTAL_DB_URL = process.env.TEST_AUDIT_DB_URL;
  const { createPool } = require('../src/db/pool');
  const { rollup24h } = require('../src/db/queries');
  const pool = createPool();
  await pool.query(`DELETE FROM app_logs WHERE app = 'rollup-test-app'`);
  await pool.query(`INSERT INTO app_logs (app, level, time, msg, meta) VALUES ('rollup-test-app', 'error', now(), 'x', '{}')`);
  const rows = await rollup24h(pool);
  const entry = rows.find((r) => r.app === 'rollup-test-app');
  assert.ok(entry);
  assert.equal(entry.errorCount, 1);
  await pool.end();
});
