import { requireAuthApi } from '../../../src/auth/requireAuthApi';
import { createPool } from '../../../src/db/pool';
import { unblockIp, logIpBlockAudit } from '../../../src/db/queries';
import { enforceUnblock, isValidIp } from '../../../src/lib/ipBlockEnforcer';
import { errorDetails } from '../../../src/lib/errorDetails';

const pool = createPool();

export default requireAuthApi(async (req, res, session) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  const { ip } = req.body || {};
  const actor = session.username;

  if (!isValidIp(ip)) {
    res.status(400).json({ error: 'invalid IP address' });
    return;
  }

  try {
    await enforceUnblock(ip);
    await unblockIp(pool, { ip, actor });
    await logIpBlockAudit(pool, { ip, action: 'unblock', actor });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', app: 'cred2tech-audit-portal', msg: `IP unblock failed for ${ip}`, error: errorDetails(err) }));
    await logIpBlockAudit(pool, { ip, action: 'unblock_failed', actor, detail: err.message });
    res.status(500).json({ error: err.message });
  }
});
