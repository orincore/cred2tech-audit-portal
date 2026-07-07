import { useState } from 'react';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listServerLogs } from '../src/db/queries';
import { serializeRows } from '../src/lib/serialize';
import { useLiveChannel } from '../src/ws/useLiveChannel';

let sharedPool;
export const getServerSideProps = requireAuthPage(async (context) => {
  sharedPool = sharedPool || createPool();
  const { source, q, from, to } = context.query;
  const rows = await listServerLogs(sharedPool, { source, q, from, to, limit: 200 });
  return { props: { rows: serializeRows(rows), filters: { source: source || '', q: q || '', from: from || '', to: to || '' } } };
});

export default function ServerLogs({ rows: initialRows, filters }) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(filters);
  const [liveOn, setLiveOn] = useState(true);

  useLiveChannel(
    'server_logs',
    { source: form.source || undefined },
    (newRows) => setRows((current) => [...newRows].reverse().concat(current).slice(0, 200)),
    { enabled: liveOn, catchUpUrl: (afterId) => `/api/server-logs?afterId=${afterId}` },
  );

  function onFilterChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(Object.entries(form).filter(([, v]) => v));
    const res = await fetch(`/api/server-logs?${params.toString()}`);
    const body = await res.json();
    setRows(body.rows);
  }

  const exportHref = `/api/server-logs/export?${new URLSearchParams(Object.entries(form).filter(([, v]) => v)).toString()}`;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <Nav activePage="server-logs" />
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Server Logs</h1>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <select value={form.source} onChange={(e) => onFilterChange('source', e.target.value)}>
            <option value="">any source</option>
            <option value="ssh">ssh</option>
            <option value="firewall">firewall</option>
            <option value="nginx">nginx</option>
            <option value="systemd">systemd</option>
          </select>
          <input placeholder="search text" value={form.q} onChange={(e) => onFilterChange('q', e.target.value)} />
          <input type="datetime-local" value={form.from} onChange={(e) => onFilterChange('from', e.target.value)} />
          <input type="datetime-local" value={form.to} onChange={(e) => onFilterChange('to', e.target.value)} />
          <button type="submit">Filter</button>
          <a href={exportHref}>Export CSV</a>
          <label>
            <input type="checkbox" checked={liveOn} onChange={(e) => setLiveOn(e.target.checked)} /> Live
          </label>
        </form>

        <table style={{ borderCollapse: 'collapse', marginTop: 16, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 4 }}>Time</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Source</th>
              <th style={{ textAlign: 'left', padding: 4 }}>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: 4 }}>{new Date(r.time).toLocaleString()}</td>
                <td style={{ padding: 4 }}>{r.source}</td>
                <td style={{ padding: 4 }}>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
