const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesFilters } = require('../src/ws/liveServer');

test('matchesFilters filters app_logs by app and level', () => {
  const row = { app: 'nestjs-backend', level: 'error' };
  assert.equal(matchesFilters(row, 'app_logs', { app: 'nestjs-backend' }), true);
  assert.equal(matchesFilters(row, 'app_logs', { app: 'other-app' }), false);
  assert.equal(matchesFilters(row, 'app_logs', { level: 'warn' }), false);
});

test('matchesFilters with no filters matches everything', () => {
  assert.equal(matchesFilters({ app: 'x' }, 'app_logs', {}), true);
});

test('matchesFilters filters server_logs by source', () => {
  const row = { source: 'nginx' };
  assert.equal(matchesFilters(row, 'server_logs', { source: 'nginx' }), true);
  assert.equal(matchesFilters(row, 'server_logs', { source: 'ssh' }), false);
});
