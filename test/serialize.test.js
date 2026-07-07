const test = require('node:test');
const assert = require('node:assert/strict');
const { serializeRows } = require('../src/lib/serialize');

test('serializeRows converts Date fields to ISO strings', () => {
  const d = new Date('2026-07-07T05:48:58.953Z');
  const [row] = serializeRows([{ id: 1, time: d }]);
  assert.equal(row.time, '2026-07-07T05:48:58.953Z');
});

test('serializeRows leaves non-Date fields (string/number) unchanged', () => {
  const [row] = serializeRows([{ app: 'my-app', restarts: 3, cpu_pct: '12.5', status: 'online' }]);
  assert.deepEqual(row, { app: 'my-app', restarts: 3, cpu_pct: '12.5', status: 'online' });
});

test('serializeRows converts Date fields under any key name, not just `time`', () => {
  const d = new Date('2026-07-06T00:00:00.000Z');
  const [row] = serializeRows([{ id: 1, ran_at: d, success: true }]);
  assert.equal(row.ran_at, '2026-07-06T00:00:00.000Z');
  assert.equal(row.success, true);
});

test('serializeRows handles multiple rows and empty input', () => {
  const rows = serializeRows([]);
  assert.deepEqual(rows, []);

  const d1 = new Date('2026-01-01T00:00:00.000Z');
  const d2 = new Date('2026-01-02T00:00:00.000Z');
  const out = serializeRows([{ time: d1 }, { time: d2 }]);
  assert.equal(out[0].time, '2026-01-01T00:00:00.000Z');
  assert.equal(out[1].time, '2026-01-02T00:00:00.000Z');
});
