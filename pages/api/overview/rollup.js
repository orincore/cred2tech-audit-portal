import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { listPm2Health, listSystemHealth, rollup24h } from '../../../src/db/queries';

const pool = createPool();

export default requireAuthApi(async (req, res) => {
  const [pm2Health, systemHealth, rollup] = await Promise.all([
    listPm2Health(pool, { limit: 200 }),
    listSystemHealth(pool, { limit: 200 }),
    rollup24h(pool),
  ]);
  res.status(200).json({ pm2Health, systemHealth, rollup });
});
