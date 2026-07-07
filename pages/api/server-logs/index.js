import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listServerLogs } from '../../../src/db/queries';
import { fetchArchivedRows } from '../../../src/db/archiveReader';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { source, q, from, to, afterId, beforeId } = req.query;
  const [hotRows, archivedRows] = await Promise.all([
    listServerLogs(pool, { source, q, from, to, afterId, beforeId, limit: 200 }),
    fetchArchivedRows({ table: 'server_logs', from, to }),
  ]);
  const filteredArchived = archivedRows.filter((r) => !source || r.source === source);
  res.status(200).json({ rows: [...hotRows, ...filteredArchived] });
});
