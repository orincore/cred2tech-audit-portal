const jwt = require('jsonwebtoken');

const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12h, per spec

function signSessionToken({ userId, username }) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign({ userId, username }, process.env.JWT_SECRET, { expiresIn: SESSION_TTL_SECONDS });
}

function verifySessionToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: payload.userId, username: payload.username };
  } catch {
    return null;
  }
}

module.exports = { signSessionToken, verifySessionToken, SESSION_TTL_SECONDS };
