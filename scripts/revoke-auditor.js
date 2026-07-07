#!/usr/bin/env node
require('dotenv').config();
const { createPool } = require('../src/db/pool');

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('usage: node scripts/revoke-auditor.js <username>');
    process.exit(1);
  }
  const pool = createPool();
  const { rowCount } = await pool.query(
    'UPDATE auditor_users SET active = false WHERE username = $1',
    [username],
  );
  if (rowCount === 0) {
    console.error(`no such auditor account: ${username}`);
    process.exit(1);
  }
  console.log(`auditor account '${username}' revoked.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
