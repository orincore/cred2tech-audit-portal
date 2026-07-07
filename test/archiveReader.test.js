const test = require('node:test');
const assert = require('node:assert/strict');
const { buildArchiveFileName, daysInRange, fetchArchivedRows } = require('../src/db/archiveReader');

test('buildArchiveFileName matches audit-log-shipper convention', () => {
  assert.equal(buildArchiveFileName('app_logs', new Date('2026-01-15T12:00:00Z')), 'app_logs/2026-01-15.json.gz.enc');
});

test('daysInRange enumerates each UTC day inclusive', () => {
  const days = daysInRange(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-03T00:00:00Z'));
  assert.equal(days.length, 3);
});

test('fetchArchivedRows returns [] when the whole range is inside the 90-day hot window', async () => {
  const rows = await fetchArchivedRows({ table: 'app_logs', from: new Date().toISOString() });
  assert.deepEqual(rows, []);
});

test('fetchArchivedRows degrades to [] (not a throw) when S3 fails for a reason other than a missing key', async () => {
  const brokenS3Client = { send: async () => { throw new Error('NoSuchBucket'); } };
  const rows = await fetchArchivedRows({
    table: 'app_logs',
    from: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    s3Client: brokenS3Client,
    bucket: 'does-not-matter',
    encryptionKey: 'does-not-matter',
  });
  assert.deepEqual(rows, []);
});
