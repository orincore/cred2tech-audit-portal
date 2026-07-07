const test = require('node:test');
const assert = require('node:assert/strict');
const { maskIdentifier } = require('../src/lib/mask');

test('maskIdentifier masks the middle, keeps first/last 2 chars', () => {
  assert.equal(maskIdentifier('user123456'), 'us******56');
});

test('maskIdentifier fully masks short identifiers', () => {
  assert.equal(maskIdentifier('abcd'), '****');
  assert.equal(maskIdentifier('ab'), '**');
});
