import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listAppLogs } from '../../../src/db/queries';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { app, level, q, from, to, afterId, beforeId } = req.query;
  const rows = await listAppLogs(pool, { app, level, q, from, to, afterId, beforeId, limit: 200 });
  res.status(200).json({ rows });
});
