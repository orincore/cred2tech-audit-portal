const cookie = require('cookie');
const { signSessionToken, verifySessionToken, SESSION_TTL_SECONDS } = require('./jwt');

const COOKIE_NAME = 'audit_portal_session';

function setSessionCookie(res, { userId, username }) {
  const token = signSessionToken({ userId, username });
  const serialized = cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  res.setHeader('Set-Cookie', serialized);
}

function clearSessionCookie(res) {
  const serialized = cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', serialized);
}

function getSessionFromReq(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  const parsed = cookie.parse(header);
  const token = parsed[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

module.exports = { setSessionCookie, clearSessionCookie, getSessionFromReq, COOKIE_NAME };
