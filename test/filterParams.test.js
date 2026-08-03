const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFilterParams, toIsoIfDatetime } = require('../src/lib/filterParams');

test('toIsoIfDatetime converts a naive datetime-local value to its UTC ISO instant', () => {
  const local = '2026-08-03T14:30';
  assert.equal(toIsoIfDatetime(local), new Date(local).toISOString());
});

test('toIsoIfDatetime passes through falsy values untouched', () => {
  assert.equal(toIsoIfDatetime(''), '');
  assert.equal(toIsoIfDatetime(undefined), undefined);
});

test('buildFilterParams converts from/to but leaves other fields as-is', () => {
  const params = buildFilterParams({
    app: 'nestjs-backend',
    level: '',
    q: 'timeout',
    from: '2026-08-03T09:00',
    to: '2026-08-03T17:00',
  });
  assert.equal(params.get('app'), 'nestjs-backend');
  assert.equal(params.get('q'), 'timeout');
  assert.equal(params.get('level'), null);
  assert.equal(params.get('from'), new Date('2026-08-03T09:00').toISOString());
  assert.equal(params.get('to'), new Date('2026-08-03T17:00').toISOString());
});

test('buildFilterParams omits empty/falsy fields entirely', () => {
  const params = buildFilterParams({ app: '', level: '', q: '', from: '', to: '' });
  assert.equal(params.toString(), '');
});
