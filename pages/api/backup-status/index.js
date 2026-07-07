import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listBackupStatus } from '../../../src/db/queries';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { from, to } = req.query;
  const rows = await listBackupStatus(pool, { from, to, limit: 200 });
  res.status(200).json({ rows });
});
