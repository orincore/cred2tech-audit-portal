import { createPool } from '../../../src/db/pool';
import { verifyPassword } from '../../../src/auth/password';
import { setSessionCookie } from '../../../src/auth/session';

const pool = createPool();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || null;
}

async function recordAttempt(username, success, ip) {
  await pool.query(
    'INSERT INTO portal_login_attempts (username, success, ip) VALUES ($1, $2, $3)',
    [username, success, ip],
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const { username, password } = req.body || {};
  const ip = clientIp(req);

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' });
    return;
  }

  const { rows } = await pool.query(
    'SELECT id, password_hash, active FROM auditor_users WHERE username = $1',
    [username],
  );
  const user = rows[0];

  if (!user || !user.active) {
    await recordAttempt(username, false, ip);
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await recordAttempt(username, false, ip);
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  await recordAttempt(username, true, ip);
  setSessionCookie(res, { userId: user.id, username });
  res.status(200).json({ ok: true });
}
