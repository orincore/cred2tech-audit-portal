const test = require('node:test');
const assert = require('node:assert/strict');
const { isValidIp } = require('../src/lib/ipBlockEnforcer');

test('isValidIp accepts real IPv4 and IPv6 addresses', () => {
  assert.equal(isValidIp('203.0.113.42'), true);
  assert.equal(isValidIp('2001:db8::1'), true);
});

test('isValidIp rejects garbage and injection attempts', () => {
  assert.equal(isValidIp('not-an-ip'), false);
  assert.equal(isValidIp('1.2.3.4; rm -rf /'), false);
  assert.equal(isValidIp('1.2.3.4\ndeny 5.6.7.8;'), false);
  assert.equal(isValidIp(''), false);
  assert.equal(isValidIp(undefined), false);
  assert.equal(isValidIp(null), false);
});

test('isValidIp refuses loopback/wildcard addresses even though they are valid IPs', () => {
  assert.equal(isValidIp('127.0.0.1'), false);
  assert.equal(isValidIp('::1'), false);
  assert.equal(isValidIp('0.0.0.0'), false);
});
