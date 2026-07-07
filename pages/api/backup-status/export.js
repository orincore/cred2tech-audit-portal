import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listBackupStatus } from '../../../src/db/queries';
import { toCsv } from '../../../src/lib/csv';

const pool = createPool();
const COLUMNS = ['id', 'source_id', 'ran_at', 'success', 'encrypted', 'detail'];

export default requireAuthApi(async (req, res) => {
  const { from, to } = req.query;
  const rows = await listBackupStatus(pool, { from, to, limit: 1000 });
  const csv = toCsv(rows, COLUMNS);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="backup-status.csv"');
  res.status(200).send(csv);
});
