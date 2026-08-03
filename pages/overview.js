import { useState } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listPm2Health, listSystemHealth, rollup24h } from '../src/db/queries';
import { serializeRows } from '../src/lib/serialize';
import { useLiveChannel } from '../src/ws/useLiveChannel';

// Loaded as ONE component (not per-subcomponent) — see SystemResourcesChart.js
// for why wrapping Line/XAxis/etc. individually in dynamic() breaks recharts.
const SystemResourcesChart = dynamic(() => import('../src/components/SystemResourcesChart'), {
  ssr: false,
  loading: () => <p className="tile-stat">Loading chart…</p>,
});

const STATUS_CLASS = { online: 'status-online', stopped: 'status-stopped', errored: 'status-errored', unknown: 'status-unknown' };

let sharedPool;

export const getServerSideProps = requireAuthPage(async () => {
  sharedPool = sharedPool || createPool();
  const [pm2Health, systemHealth, rollup] = await Promise.all([
    listPm2Health(sharedPool, { limit: 200 }),
    listSystemHealth(sharedPool, { limit: 200 }),
    rollup24h(sharedPool),
  ]);
  return {
    props: {
      pm2Health: serializeRows(pm2Health),
      systemHealth: serializeRows(systemHealth),
      rollup,
    },
  };
});

function latestPerApp(rows) {
  const byApp = {};
  for (const row of rows) {
    if (!byApp[row.app] || new Date(row.time) > new Date(byApp[row.app].time)) byApp[row.app] = row;
  }
  return Object.values(byApp);
}

export default function Overview({ pm2Health, systemHealth, rollup }) {
  const [liveOn, setLiveOn] = useState(true);
  const [pm2Rows, setPm2Rows] = useState(pm2Health);
  const latest = latestPerApp(pm2Rows);
  useLiveChannel(
    'pm2_health',
    {},
    (newRows) => setPm2Rows((current) => [...current, ...newRows].slice(-500)),
    { enabled: liveOn, catchUpUrl: (afterId) => `/api/pm2-health?afterId=${afterId}` },
  );
  const chartData = [...systemHealth].reverse().map((r) => ({
    time: new Date(r.time).toLocaleTimeString(),
    cpu: r.cpu_load,
    mem: r.mem_used_pct,
    disk: r.disk_used_pct,
  }));

  return (
    <div className="shell">
      <Head>
        <title>Overview — Monitoring Services</title>
      </Head>
      <Nav activePage="overview" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">System &amp; Application Health</p>
            <h1 className="page-title">Overview</h1>
          </div>
          <div className="page-head-actions">
            <label className="live-toggle">
              <input type="checkbox" checked={liveOn} onChange={(e) => setLiveOn(e.target.checked)} /> Live
            </label>
          </div>
        </div>

        <section className="section">
          <h2 className="section-title">Process status</h2>
          <div className="tile-row">
            {latest.map((app) => (
              <div key={app.app} className="tile">
                <div className="tile-head">
                  <span className={`seal ${STATUS_CLASS[app.status] || 'status-unknown'}`} aria-hidden="true" />
                  <span className="tile-name">{app.app}</span>
                </div>
                <p className="tile-stat"><b>{app.status}</b></p>
                <p className="tile-stat">Restarts: <b>{app.restarts}</b></p>
                <p className="tile-stat">CPU <b>{app.cpu_pct}%</b> · Mem <b>{app.mem_mb} MB</b></p>
              </div>
            ))}
            {latest.length === 0 && <p className="tile-stat">No process data yet.</p>}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">24h rollup</h2>
          <div className="ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>App</th>
                  <th>Errors (24h)</th>
                  <th>Restarts (24h)</th>
                </tr>
              </thead>
              <tbody>
                {rollup.map((r) => (
                  <tr key={r.app}>
                    <td className="col-time">{r.app}</td>
                    <td>{r.errorCount}</td>
                    <td>{r.restartCount}</td>
                  </tr>
                ))}
                {rollup.length === 0 && (
                  <tr className="empty-row"><td colSpan={3}>No activity in the last 24 hours.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section panel" style={{ height: 320 }}>
          <h2 className="section-title">System resources</h2>
          <SystemResourcesChart data={chartData} />
        </section>
      </main>
    </div>
  );
}
