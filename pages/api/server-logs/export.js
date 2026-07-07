import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listServerLogs } from '../../../src/db/queries';
import { toCsv } from '../../../src/lib/csv';

const pool = createPool();
const COLUMNS = ['id', 'source', 'time', 'message', 'meta'];

export default requireAuthApi(async (req, res) => {
  const { source, q, from, to } = req.query;
  const rows = await listServerLogs(pool, { source, q, from, to, limit: 1000 });
  const csv = toCsv(rows, COLUMNS);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="server-logs.csv"');
  res.status(200).send(csv);
});
