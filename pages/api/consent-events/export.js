import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listConsentEvents } from '../../../src/db/queries';
import { toCsv } from '../../../src/lib/csv';
import { maskIdentifier } from '../../../src/lib/mask';

const pool = createPool();
const COLUMNS = ['id', 'source_id', 'user_id', 'purpose', 'event_type', 'time'];

export default requireAuthApi(async (req, res) => {
  const { eventType, from, to } = req.query;
  const rows = await listConsentEvents(pool, { eventType, from, to, limit: 1000 });
  const masked = rows.map((r) => ({ ...r, user_id: maskIdentifier(r.user_id) }));
  const csv = toCsv(masked, COLUMNS);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="consent-events.csv"');
  res.status(200).send(csv);
});
