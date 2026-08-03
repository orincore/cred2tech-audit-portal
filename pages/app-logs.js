import { useState } from 'react';
import Head from 'next/head';
import Nav from '../src/components/Nav';
import { requireAuthPage } from '../src/auth/requireAuthPage';
import { createPool } from '../src/db/pool';
import { listAppLogs } from '../src/db/queries';
import { serializeRows } from '../src/lib/serialize';
import { buildFilterParams } from '../src/lib/filterParams';
import { useLiveChannel } from '../src/ws/useLiveChannel';

// Must match the `app` labels in audit-log-shipper's src/tail/appLogTailers.js
// (APP_LOG_FILES) — those are the only app names that ever appear in app_logs.
const APP_OPTIONS = ['nestjs-backend', 'ai-eligibility-check-engine', 'cred2tech-backend'];

// pino's own msg ("request completed" / "access log") carries no real
// information — the useful fields live in `meta`, in one of two shapes
// depending on which backend logged it: nestjs-backend/cred2tech-backend's
// custom AccessLogInterceptor puts method/url/statusCode/durationMs/userId
// flat on meta; eligibility-engine's plain pino-http nests them under
// meta.req/meta.res with responseTime instead of durationMs.
function requestInfo(meta) {
  if (!meta) return null;
  const method = meta.method || meta.req?.method;
  const path = meta.url || meta.req?.url;
  if (!method && !path) return null;
  const status = meta.statusCode ?? meta.res?.statusCode ?? null;
  const durationMs = meta.durationMs ?? meta.responseTime ?? null;
  const user = meta.userId && meta.userId !== 'anonymous' ? meta.userId : null;
  return { method, path, status, durationMs, user };
}

function statusBadgeClass(status) {
  if (status == null) return 'level-info';
  if (status >= 500) return 'level-error';
  if (status >= 400) return 'level-warn';
  return 'level-info';
}

let sharedPool;
export const getServerSideProps = requireAuthPage(async (context) => {
  sharedPool = sharedPool || createPool();
  const { app, level, q, from, to } = context.query;
  const rows = await listAppLogs(sharedPool, { app, level, q, from, to, limit: 200 });
  return { props: { rows: serializeRows(rows), filters: { app: app || '', level: level || '', q: q || '', from: from || '', to: to || '' } } };
});

export default function AppLogs({ rows: initialRows, filters }) {
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState(filters);
  const [liveOn, setLiveOn] = useState(!(filters.from || filters.to));

  useLiveChannel(
    'app_logs',
    { app: form.app || undefined, level: form.level || undefined },
    (newRows) => setRows((current) => [...newRows].reverse().concat(current).slice(0, 200)),
    { enabled: liveOn, catchUpUrl: (afterId) => `/api/app-logs?afterId=${afterId}` },
  );

  function onFilterChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (form.from || form.to) setLiveOn(false);
    const params = buildFilterParams(form);
    const res = await fetch(`/api/app-logs?${params.toString()}`);
    const body = await res.json();
    setRows(body.rows);
  }

  const exportHref = `/api/app-logs/export?${buildFilterParams(form).toString()}`;

  return (
    <div className="shell">
      <Head>
        <title>Application Logs — Monitoring Services</title>
      </Head>
      <Nav activePage="app-logs" />
      <main className="main">
        <div className="page-head">
          <div>
            <p className="page-eyebrow">Activity Log</p>
            <h1 className="page-title">Application Logs</h1>
          </div>
        </div>

        <form onSubmit={onSubmit} className="filter-bar">
          <select value={form.app} onChange={(e) => onFilterChange('app', e.target.value)}>
            <option value="">All backends</option>
            {APP_OPTIONS.map((app) => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
          <select value={form.level} onChange={(e) => onFilterChange('level', e.target.value)}>
            <option value="">any level</option>
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
            <option value="fatal">fatal</option>
          </select>
          <input placeholder="search text" value={form.q} onChange={(e) => onFilterChange('q', e.target.value)} />
          <input type="datetime-local" value={form.from} onChange={(e) => onFilterChange('from', e.target.value)} />
          <input type="datetime-local" value={form.to} onChange={(e) => onFilterChange('to', e.target.value)} />
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
                <th>App</th>
                <th>Level</th>
                <th>Request</th>
                <th>Status</th>
                <th>Duration</th>
                <th>User</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const req = requestInfo(r.meta);
                return (
                  <tr key={r.id}>
                    <td className="col-time">{new Date(r.time).toLocaleString()}</td>
                    <td>{r.app}</td>
                    <td>
                      <span className={`badge level-${r.level}`}>
                        <span className="dot" aria-hidden="true" />
                        {r.level}
                      </span>
                    </td>
                    <td className="col-time">{req ? `${req.method} ${req.path}` : '—'}</td>
                    <td>
                      {req && req.status != null ? (
                        <span className={`badge ${statusBadgeClass(req.status)}`}>
                          <span className="dot" aria-hidden="true" />
                          {req.status}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="col-time">{req && req.durationMs != null ? `${req.durationMs}ms` : '—'}</td>
                    <td>{req?.user || '—'}</td>
                    <td>{r.msg}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={8}>No log entries match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
