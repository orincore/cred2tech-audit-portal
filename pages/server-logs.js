import { useState, Fragment } from 'react';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import DateTimeField from '../src/components/DateTimeField';
import LogDetailPanel from '../src/components/LogDetailPanel';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listServerLogs } from '../src/db/queries';
import { serializeRows } from '../src/lib/serialize';
import { buildFilterParams } from '../src/lib/filterParams';
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
  const [liveOn, setLiveOn] = useState(!(filters.from || filters.to));
  const [expandedId, setExpandedId] = useState(null);

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
    if (form.from || form.to) setLiveOn(false);
    const params = buildFilterParams(form);
    const res = await fetch(`/api/server-logs?${params.toString()}`);
    const body = await res.json();
    setRows(body.rows);
  }

  const exportHref = `/api/server-logs/export?${buildFilterParams(form).toString()}`;

  return (
    <div className="shell">
      <Head>
        <title>Server Logs — Monitoring Services</title>
      </Head>
      <Nav activePage="server-logs" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">Activity Log</p>
            <h1 className="page-title">Server Logs</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="filter-bar">
          <select value={form.source} onChange={(e) => onFilterChange('source', e.target.value)}>
            <option value="">any source</option>
            <option value="ssh">ssh</option>
            <option value="firewall">firewall</option>
            <option value="nginx">nginx</option>
            <option value="systemd">systemd</option>
          </select>
          <input placeholder="search text" value={form.q} onChange={(e) => onFilterChange('q', e.target.value)} />
          <DateTimeField label="from" value={form.from} onChange={(v) => onFilterChange('from', v)} />
          <DateTimeField label="to" value={form.to} onChange={(v) => onFilterChange('to', v)} />
          <button type="submit" className="btn-primary">Filter</button>
          <a href={exportHref} className="export-link">Export CSV</a>
          <label className="live-toggle">
            <input type="checkbox" checked={liveOn} onChange={(e) => setLiveOn(e.target.checked)} /> Live
          </label>
        </form>

        <div className="ledger-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Time</th>
                <th>Source</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isExpanded = expandedId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className={`log-row${isExpanded ? ' is-expanded' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      title="Click to see the full log entry"
                    >
                      <td className="col-time">{new Date(r.time).toLocaleString()}</td>
                      <td>{r.source}</td>
                      <td>{r.message}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="log-detail-row">
                        <td colSpan={3}>
                          <LogDetailPanel row={r} messageField="message" />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={3}>No log entries match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
