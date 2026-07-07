#!/usr/bin/env node
require('dotenv').config();
const { createPool, ensureSchema } = require('../src/db/pool');
const { hashPassword } = require('../src/auth/password');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

async function main() {
  const { username, password } = parseArgs(process.argv.slice(2));
  if (!username || !password) {
    console.error('usage: node scripts/create-auditor.js --username <name> --password <pass>');
    process.exit(1);
  }

  const pool = createPool();
  await ensureSchema(pool);
  const hash = await hashPassword(password);
  await pool.query(
    `INSERT INTO auditor_users (username, password_hash, active) VALUES ($1, $2, true)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = true`,
    [username, hash],
  );
  console.log(`auditor account '${username}' created/updated.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
