import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { blockIp, logIpBlockAudit } from '../../../src/db/queries';
import { enforceBlock, isValidIp } from '../../../src/lib/ipBlockEnforcer';
import { errorDetails } from '../../../src/lib/errorDetails';

const pool = createPool();

export default requireAuthApi(async (req, res, session) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const { ip, reason } = req.body || {};
  const actor = session.username;

  if (!isValidIp(ip)) {
    res.status(400).json({ error: 'invalid or disallowed IP address' });
    return;
  }

  try {
    await enforceBlock(ip);
    await blockIp(pool, { ip, reason, actor });
    await logIpBlockAudit(pool, { ip, action: 'block', reason, actor });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: `IP block failed for ${ip}`, error: errorDetails(err) }));
    await logIpBlockAudit(pool, { ip, action: 'block_failed', reason, actor, detail: err.message });
    res.status(500).json({ error: err.message });
  }
});
