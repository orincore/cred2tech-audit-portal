import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listAppLogs } from '../../../src/db/queries';
import { toCsv } from '../../../src/lib/csv';

const pool = createPool();
const COLUMNS = ['id', 'app', 'level', 'time', 'msg', 'meta'];

export default requireAuthApi(async (req, res) => {
  const { app, level, q, from, to } = req.query;
  const rows = await listAppLogs(pool, { app, level, q, from, to, limit: 1000 });
  const csv = toCsv(rows, COLUMNS);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="app-logs.csv"');
  res.status(200).send(csv);
});
