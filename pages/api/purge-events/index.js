import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listPurgeEvents } from '../../../src/db/queries';
import { maskIdentifier } from '../../../src/lib/mask';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { sourceTable, status, from, to } = req.query;
  const rows = await listPurgeEvents(pool, { sourceTable, status, from, to, limit: 200 });
  res.status(200).json({ rows: rows.map((r) => ({ ...r, customer_id: maskIdentifier(r.customer_id) })) });
});
