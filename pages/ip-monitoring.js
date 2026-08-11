import { useState } from 'react';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listIpActivity, listBlockedIps } from '../src/db/queries';
import { serializeRows } from '../src/lib/serialize';

let sharedPool;
export const getServerSideProps = requireAuthPage(async () => {
  sharedPool = sharedPool || createPool();
  const [activity, blocked] = await Promise.all([
    listIpActivity(sharedPool, { hours: 24, limit: 200 }),
    listBlockedIps(sharedPool),
  ]);
  const blockedSet = new Set(blocked.map((b) => b.ip));
  const rows = activity.map((r) => ({ ...r, blocked: blockedSet.has(r.ip) }));
  return { props: { rows: serializeRows(rows), blocked: serializeRows(blocked) } };
});

export default function IpMonitoring({ rows: initialRows, blocked: initialBlocked }) {
  const [rows, setRows] = useState(initialRows);
  const [blocked, setBlocked] = useState(initialBlocked);
  const [reasons, setReasons] = useState({});
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [busyIp, setBusyIp] = useState(null);
  const [error, setError] = useState('');

  async function refresh() {
    const res = await fetch('/api/ip-monitoring?hours=24');
    const body = await res.json();
    setRows(body.rows);
    setBlocked(body.blocked);
  }

  async function doBlock(ip, reason) {
    setError('');
    setBusyIp(ip);
    try {
      const res = await fetch('/api/ip-monitoring/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason: reason || undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'block failed');
      await refresh();
    } catch (e) {
      setError(`Failed to block ${ip}: ${e.message}`);
    } finally {
      setBusyIp(null);
    }
  }

  async function doUnblock(ip) {
    setError('');
    setBusyIp(ip);
    try {
      const res = await fetch('/api/ip-monitoring/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'unblock failed');
      await refresh();
    } catch (e) {
      setError(`Failed to unblock ${ip}: ${e.message}`);
    } finally {
      setBusyIp(null);
    }
  }

  async function onManualBlockSubmit(e) {
    e.preventDefault();
    if (!manualIp) return;
    await doBlock(manualIp, manualReason);
    setManualIp('');
    setManualReason('');
  }

  return (
    <div className="shell">
      <Head>
        <title>IP Monitoring — Monitoring Services</title>
      </Head>
      <Nav activePage="ip-monitoring" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">Security</p>
            <h1 className="page-title">IP Monitoring</h1>
          </div>
        </div>

        {error && <p className="log-detail-stack" style={{ marginBottom: 12 }}>{error}</p>}

        <section className="section">
          <h2 className="section-title">Block an IP</h2>
          <form onSubmit={onManualBlockSubmit} className="filter-bar">
            <input placeholder="IP address" value={manualIp} onChange={(e) => setManualIp(e.target.value)} />
            <input placeholder="reason (optional)" value={manualReason} onChange={(e) => setManualReason(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={!manualIp || busyIp === manualIp}>
              {busyIp === manualIp ? 'Blocking…' : 'Block'}
            </button>
          </form>
          <p className="tile-stat">
            Blocking is enforced at the edge (Nginx + firewall) — it applies across every
            production service on the VPS, not just this portal.
          </p>
        </section>

        <section className="section">
          <h2 className="section-title">Currently blocked</h2>
          <div className="ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>IP</th>
                  <th>Reason</th>
                  <th>Blocked by</th>
                  <th>Blocked at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((b) => (
                  <tr key={b.ip}>
                    <td className="col-time">{b.ip}</td>
                    <td>{b.reason || '—'}</td>
                    <td>{b.blocked_by}</td>
                    <td className="col-time">{new Date(b.blocked_at).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="export-link"
                        onClick={() => doUnblock(b.ip)}
                        disabled={busyIp === b.ip}
                      >
                        {busyIp === b.ip ? 'Unblocking…' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))}
                {blocked.length === 0 && (
                  <tr className="empty-row"><td colSpan={5}>No IPs are currently blocked.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Request activity by IP (last 24h, all services)</h2>
          <div className="ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>IP</th>
                  <th>Requests</th>
                  <th>Errors (4xx/5xx)</th>
                  <th>First seen</th>
                  <th>Last seen</th>
                  <th>Reason</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.ip}>
                    <td className="col-time">{r.ip}</td>
                    <td>{r.request_count}</td>
                    <td>
                      {Number(r.error_count) > 0 ? (
                        <span className="badge level-error"><span className="dot" aria-hidden="true" />{r.error_count}</span>
                      ) : '0'}
                    </td>
                    <td className="col-time">{new Date(r.first_seen).toLocaleString()}</td>
                    <td className="col-time">{new Date(r.last_seen).toLocaleString()}</td>
                    <td>
                      {!r.blocked && (
                        <input
                          placeholder="reason (optional)"
                          value={reasons[r.ip] || ''}
                          onChange={(e) => setReasons((cur) => ({ ...cur, [r.ip]: e.target.value }))}
                        />
                      )}
                    </td>
                    <td>
                      {r.blocked ? (
                        <span className="badge level-error"><span className="dot" aria-hidden="true" />Blocked</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => doBlock(r.ip, reasons[r.ip])}
                          disabled={busyIp === r.ip}
                        >
                          {busyIp === r.ip ? 'Blocking…' : 'Block'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="empty-row"><td colSpan={7}>No request activity in the last 24 hours.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
