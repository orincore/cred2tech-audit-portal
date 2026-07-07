const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-secret';
const { signSessionToken } = require('../src/auth/jwt');
const { requireAuthApi } = require('../src/auth/requireAuthApi');
const { requireAuthPage } = require('../src/auth/requireAuthPage');

function fakeRes() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('requireAuthApi rejects requests with no session cookie', async () => {
  const handler = requireAuthApi(async (req, res) => res.status(200).json({ ok: true }));
  const res = fakeRes();
  await handler({ headers: {} }, res);
  assert.equal(res.statusCode, 401);
});

test('requireAuthApi allows requests with a valid session cookie', async () => {
  const token = signSessionToken({ userId: 1, username: 'auditor1' });
  const handler = requireAuthApi(async (req, res, session) => res.status(200).json({ username: session.username }));
  const res = fakeRes();
  await handler({ headers: { cookie: `audit_portal_session=${token}` } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.username, 'auditor1');
});

test('requireAuthPage redirects to /login with no session', async () => {
  const gsp = requireAuthPage(async () => ({ props: {} }));
  const result = await gsp({ req: { headers: {} } });
  assert.equal(result.redirect.destination, '/login');
});
