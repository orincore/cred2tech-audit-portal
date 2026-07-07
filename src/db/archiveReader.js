const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const execFileAsync = promisify(execFile);
const HOT_WINDOW_DAYS = 90;

function buildArchiveFileName(table, day) {
  const iso = day.toISOString().slice(0, 10);
  return `${table}/${iso}.json.gz.enc`;
}

function daysInRange(from, to) {
  const days = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

async function fetchAndDecryptDay({ table, day, s3Client, bucket, encryptionKey }) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-portal-archive-'));
  const encPath = path.join(tmpDir, 'data.json.gz.enc');
  const jsonPath = path.join(tmpDir, 'data.json');

  try {
    let body;
    try {
      const result = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: buildArchiveFileName(table, day) }));
      body = Buffer.from(await result.Body.transformToByteArray());
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.Code === 'NoSuchKey') return [];
      throw err;
    }

    await fs.writeFile(encPath, body);
    await execFileAsync(
      'bash',
      [
        '-c',
        `set -o pipefail; openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass env:ARCHIVE_ENC_KEY -in "${encPath}" | gunzip -c > "${jsonPath}"`,
      ],
      { env: { ...process.env, ARCHIVE_ENC_KEY: encryptionKey } },
    );

    const raw = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(raw);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function fetchArchivedRows({ table, from, to, s3Client, bucket, encryptionKey }) {
  if (!from) return [];
  const fromDate = new Date(from);
  const toDate = to ? new Date(to) : new Date();
  const hotBoundary = new Date(Date.now() - HOT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (fromDate >= hotBoundary) return []; // entire range is in the hot window, nothing to archive-fetch

  const client = s3Client || new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
  const bucketName = bucket || process.env.AUDIT_ARCHIVE_S3_BUCKET;
  const key = encryptionKey || process.env.ARCHIVE_ENCRYPTION_KEY;
  const archivedEnd = toDate < hotBoundary ? toDate : hotBoundary;

  const days = daysInRange(fromDate, archivedEnd);
  const perDay = await Promise.all(
    days.map((day) =>
      fetchAndDecryptDay({ table, day, s3Client: client, bucket: bucketName, encryptionKey: key }).catch((err) => {
        console.error(JSON.stringify({
          level: 'error',
          app: 'cred2tech-audit-portal',
          msg: `archive fetch failed for ${table}/${day.toISOString().slice(0, 10)}: ${err.message}`,
        }));
        return [];
      }),
    ),
  );
  return perDay.flat();
}

module.exports = { fetchArchivedRows, buildArchiveFileName, daysInRange, HOT_WINDOW_DAYS };
