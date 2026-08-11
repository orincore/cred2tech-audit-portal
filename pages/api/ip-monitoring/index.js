import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listIpActivity, listBlockedIps } from '../../../src/db/queries';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const hours = Number(req.query.hours) || 24;
  const [activity, blocked] = await Promise.all([
    listIpActivity(pool, { hours, limit: 200 }),
    listBlockedIps(pool),
  ]);
  const blockedSet = new Set(blocked.map((b) => b.ip));
  const rows = activity.map((r) => ({ ...r, blocked: blockedSet.has(r.ip) }));
  res.status(200).json({ rows, blocked });
});
