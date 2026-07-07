const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/auth/password');

test('hashPassword + verifyPassword round-trip', async () => {
  const hash = await hashPassword('correct horse battery staple');
  assert.equal(await verifyPassword('correct horse battery staple', hash), true);
  assert.equal(await verifyPassword('wrong password', hash), false);
});

test('signSessionToken + verifySessionToken round-trip', () => {
  process.env.JWT_SECRET = 'test-secret';
  const { signSessionToken, verifySessionToken } = require('../src/auth/jwt');
  const token = signSessionToken({ userId: 1, username: 'auditor1' });
  const payload = verifySessionToken(token);
  assert.equal(payload.userId, 1);
  assert.equal(payload.username, 'auditor1');
});

test('verifySessionToken rejects a garbage token', () => {
  process.env.JWT_SECRET = 'test-secret';
  const { verifySessionToken } = require('../src/auth/jwt');
  assert.equal(verifySessionToken('not-a-real-token'), null);
});
