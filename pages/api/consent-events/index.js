import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listConsentEvents } from '../../../src/db/queries';
import { maskIdentifier } from '../../../src/lib/mask';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const { eventType, from, to } = req.query;
  const rows = await listConsentEvents(pool, { eventType, from, to, limit: 200 });
  res.status(200).json({ rows: rows.map((r) => ({ ...r, user_id: maskIdentifier(r.user_id) })) });
});
