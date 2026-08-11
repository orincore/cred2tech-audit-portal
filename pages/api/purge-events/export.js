import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listPurgeEvents } from '../../../src/db/queries';
import { toCsv } from '../../../src/lib/csv';
import { maskIdentifier } from '../../../src/lib/mask';

const pool = createPool();
const COLUMNS = ['id', 'source_id', 'source_table', 'record_id', 'customer_id', 'tenant_id', 'purged_fields', 'files_deleted', 'status', 'purged_at'];

export default requireAuthApi(async (req, res) => {
  const { sourceTable, status, from, to } = req.query;
  const rows = await listPurgeEvents(pool, { sourceTable, status, from, to, limit: 1000 });
  const masked = rows.map((r) => ({ ...r, customer_id: maskIdentifier(r.customer_id) }));
  const csv = toCsv(masked, COLUMNS);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="purge-events.csv"');
  res.status(200).send(csv);
});
