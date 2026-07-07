import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listPm2Health } from '../../../src/db/queries';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { app, afterId } = req.query;
  const rows = await listPm2Health(pool, { app, afterId, limit: 500 });
  res.status(200).json({ rows });
});
