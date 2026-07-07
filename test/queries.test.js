require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert/strict');
const { toCsv } = require('../src/lib/csv');

test('toCsv escapes commas, quotes, and newlines', () => {
  const rows = [{ a: 'hello, world', b: 'has "quotes"', c: 'line1\nline2' }];
  const csv = toCsv(rows, ['a', 'b', 'c']);
  assert.equal(csv, 'a,b,c\n"hello, world","has ""quotes""","line1\nline2"');
});

test('toCsv stringifies object cells (e.g. meta jsonb)', () => {
  const rows = [{ meta: { userId: 42 } }];
  assert.equal(toCsv(rows, ['meta']), 'meta\n"{""userId"":42}"');
});

test('listAppLogs + friends against a real test DB', async (t) => {
  if (!process.env.TEST_AUDIT_DB_URL) {
    t.skip('TEST_AUDIT_DB_URL not set — skipping integration test');
    return;
  }
  process.env.PORTAL_DB_URL = process.env.TEST_AUDIT_DB_URL;
  const { createPool } = require('../src/db/pool');
  const { listAppLogs } = require('../src/db/queries');
  const pool = createPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_logs (
      id BIGSERIAL PRIMARY KEY, app TEXT NOT NULL, level TEXT NOT NULL,
      time TIMESTAMPTZ NOT NULL, msg TEXT NOT NULL, meta JSONB NOT NULL DEFAULT '{}'::jsonb
    );
  `);
  await pool.query(`DELETE FROM app_logs WHERE app = 'test-portal-app'`);
  await pool.query(
    `INSERT INTO app_logs (app, level, time, msg, meta) VALUES ('test-portal-app', 'error', now(), 'boom', '{}')`,
  );
  const rows = await listAppLogs(pool, { app: 'test-portal-app', level: 'error' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].msg, 'boom');
  await pool.end();
});
