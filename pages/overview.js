import { useState } from 'react';
import dynamic from 'next/dynamic';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listPm2Health, listSystemHealth, rollup24h } from '../src/db/queries';

const LineChart = dynamic(() => import('recharts').then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import('recharts').then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then((m) => m.ResponsiveContainer), { ssr: false });

const STATUS_COLOR = { online: '#16a34a', stopped: '#dc2626', errored: '#dc2626', unknown: '#ca8a04' };

let sharedPool;

// pg returns TIMESTAMPTZ columns as JS Date objects; Next.js's getServerSideProps
// props must be plain JSON-serializable values, so Date instances need converting
// to ISO strings before being handed to the page component (otherwise Next throws
// "Error serializing ... Date objects are not supported" once any row exists).
function serializeRows(rows) {
  return rows.map((row) => (row && row.time instanceof Date ? { ...row, time: row.time.toISOString() } : row));
}

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
  const [latest] = useState(() => latestPerApp(pm2Health));
  const chartData = [...systemHealth].reverse().map((r) => ({
    time: new Date(r.time).toLocaleTimeString(),
    cpu: r.cpu_load,
    mem: r.mem_used_pct,
    disk: r.disk_used_pct,
  }));

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Nav activePage="overview" />
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Overview</h1>
        <section style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          {latest.map((app) => (
            <div
              key={app.app}
              style={{
                border: `2px solid ${STATUS_COLOR[app.status] || STATUS_COLOR.unknown}`,
                borderRadius: 8, padding: 16, minWidth: 200,
              }}
            >
              <strong>{app.app}</strong>
              <p>Status: {app.status}</p>
              <p>Restarts: {app.restarts}</p>
              <p>CPU: {app.cpu_pct}% · Mem: {app.mem_mb} MB</p>
            </div>
          ))}
        </section>

        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 16 }}>24h rollup</h2>
          <table style={{ borderCollapse: 'collapse', marginTop: 8 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 4 }}>App</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Errors (24h)</th>
                <th style={{ textAlign: 'left', padding: 4 }}>Restarts (24h)</th>
              </tr>
            </thead>
            <tbody>
              {rollup.map((r) => (
                <tr key={r.app}>
                  <td style={{ padding: 4 }}>{r.app}</td>
                  <td style={{ padding: 4 }}>{r.errorCount}</td>
                  <td style={{ padding: 4 }}>{r.restartCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ marginTop: 32, height: 300 }}>
          <h2 style={{ fontSize: 16 }}>System resources</h2>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#2563eb" dot={false} name="CPU load" />
              <Line type="monotone" dataKey="mem" stroke="#16a34a" dot={false} name="Mem used %" />
              <Line type="monotone" dataKey="disk" stroke="#ca8a04" dot={false} name="Disk used %" />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </main>
    </div>
  );
}
