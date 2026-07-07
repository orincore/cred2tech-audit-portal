import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listAppLogs } from '../../../src/db/queries';
import { fetchArchivedRows } from '../../../src/db/archiveReader';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { app, level, q, from, to, afterId, beforeId } = req.query;
  const [hotRows, archivedRows] = await Promise.all([
    listAppLogs(pool, { app, level, q, from, to, afterId, beforeId, limit: 200 }),
    fetchArchivedRows({ table: 'app_logs', from, to }),
  ]);
  const filteredArchived = archivedRows.filter((r) => (!app || r.app === app) && (!level || r.level === level));
  res.status(200).json({ rows: [...hotRows, ...filteredArchived] });
});
